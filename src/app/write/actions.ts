"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CONSENT_TEXT_VERSION, type ComposeState } from "@/lib/consent.ts";
import { seal } from "@/lib/crypto.ts";
import { db, toBytea } from "@/lib/db.ts";
import { type LetterDraft, validateDraft } from "@/lib/letters.ts";
import { breakdown, isSku } from "@/lib/pricing.ts";
import { createCheckoutSession } from "@/lib/stripe.ts";

export async function composeLetter(
  _previous: ComposeState,
  formData: FormData,
): Promise<ComposeState> {
  const sku = String(formData.get("sku") ?? "single");
  if (!isSku(sku)) {
    return { error: "Pick a letter or a pair.", field: "sku" };
  }

  const draft = validateDraft({
    body: formData.get("body"),
    deliverOn: formData.get("deliverOn"),
    recipient: {
      name: formData.get("name"),
      line1: formData.get("line1"),
      line2: formData.get("line2"),
      postcode: formData.get("postcode"),
      city: formData.get("city"),
      country: formData.get("country"),
    },
  });

  if (!draft.ok) {
    return { error: draft.message, field: draft.field };
  }

  const drafts: LetterDraft[] = [draft.value];

  // The pair SKU sells two letters to one date. It has to produce two rows:
  // charging €29 and storing a single letter would be taking money for
  // something the form explicitly promises.
  if (sku === "pair") {
    const sameAddress = formData.get("sameAddress") === "on";

    const second = validateDraft({
      body: formData.get("body_2"),
      deliverOn: formData.get("deliverOn"),
      recipient: sameAddress
        ? draft.value.recipient
        : {
            name: formData.get("name_2"),
            line1: formData.get("line1_2"),
            line2: formData.get("line2_2"),
            postcode: formData.get("postcode_2"),
            city: formData.get("city_2"),
            country: formData.get("country_2"),
          },
    });

    if (!second.ok) {
      // The second letter's inputs carry a _2 suffix, so the form can
      // highlight the field the customer actually needs to fix.
      return { error: second.message, field: `${second.field}_2` };
    }

    drafts.push(second.value);
  }

  // Both boxes are required and neither is pre-ticked. The burden of proving
  // consent sits with the operator, so what was agreed is recorded verbatim.
  const art9Ack = formData.get("art9") === "on";
  const withdrawalAck = formData.get("withdrawal") === "on";
  if (!art9Ack || !withdrawalAck) {
    return {
      error: "Both confirmations are needed before we can hold your letter.",
      field: !art9Ack ? "art9" : "withdrawal",
    };
  }

  const supabase = db();
  const { grossCents, vatCents } = breakdown(sku);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      stripe_session_id: `pending_${crypto.randomUUID()}`,
      sku,
      amount_cents: grossCents,
      vat_cents: vatCents,
      status: "pending",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    console.error("Could not create order", orderError);
    return { error: "We could not start checkout. Please try again." };
  }

  // Letter bodies are far larger than Stripe's metadata limit, so they are
  // sealed and stored first. They stay 'pending_payment' — and therefore
  // invisible to the dispatch worker — until the webhook promotes them.
  // Each letter gets its own IV: seal() never reuses one.
  const { error: letterError } = await supabase.from("letters").insert(
    drafts.map((d) => {
      const sealed = seal(d.body);
      return {
        order_id: order.id,
        content_ciphertext: toBytea(sealed.ciphertext),
        content_iv: toBytea(sealed.iv),
        key_version: sealed.keyVersion,
        recipient: d.recipient,
        deliver_on: d.deliverOn,
        status: "pending_payment",
      };
    }),
  );

  if (letterError) {
    console.error("Could not store letter", letterError);
    return { error: "We could not save your letter. Please try again." };
  }

  const session = await createCheckoutSession({ sku, orderId: order.id });
  if (!session.url) {
    return { error: "Stripe did not return a checkout link. Please retry." };
  }

  // The real session id replaces the placeholder; this is what the webhook
  // matches on, and the unique constraint is what makes replay a no-op.
  await supabase
    .from("orders")
    .update({ stripe_session_id: session.id })
    .eq("id", order.id);

  const requestHeaders = await headers();
  await supabase.from("consent_log").insert({
    order_id: order.id,
    art9_ack: art9Ack,
    withdrawal_ack: withdrawalAck,
    text_version: CONSENT_TEXT_VERSION,
    ip: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    user_agent: requestHeaders.get("user-agent"),
  });

  // redirect() signals by throwing, so nothing may follow it here.
  redirect(session.url);
}
