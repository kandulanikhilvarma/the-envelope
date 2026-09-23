import type Stripe from "stripe";
import { db } from "@/lib/db.ts";
import { confirmationEmail, sendEmail } from "@/lib/email.ts";
import type { Recipient } from "@/lib/letters.ts";
import { parseWebhookEvent } from "@/lib/stripe.ts";
import { eraseLetters } from "@/lib/withdraw.ts";

/**
 * Stripe webhook.
 *
 * Three events matter, and each one moves letters between states that the
 * dispatch worker reads:
 *
 *   checkout.session.completed → pending_payment becomes scheduled.
 *   checkout.session.expired   → an abandoned letter is erased rather than
 *                                left encrypted in the table forever.
 *   charge.refunded            → a refund issued in the Stripe dashboard
 *                                stops the letter, which would otherwise
 *                                still be posted on the day.
 *
 * Idempotency is enforced by the database, not by this handler: every
 * transition carries a status predicate, so a replay matches no rows and
 * changes nothing. Stripe retries the same event on any non-2xx, so a replay
 * has to be a no-op rather than a second order or a second email.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature", { status: 400 });
  }

  // Raw text, not request.json(). Re-serialising changes the bytes and the
  // signature no longer verifies.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = parseWebhookEvent(rawBody, signature);
  } catch (error) {
    // A bad signature is not our bug to retry, refuse it and stop.
    const message = error instanceof Error ? error.message : "invalid";
    return new Response(`Signature verification failed: ${message}`, {
      status: 400,
    });
  }

  switch (event.type) {
    case "checkout.session.completed":
      return onPaid(event.data.object as Stripe.Checkout.Session);
    case "checkout.session.expired":
      return onExpired(event.data.object as Stripe.Checkout.Session);
    case "charge.refunded":
      return onRefunded(event.data.object as Stripe.Charge);
    default:
      return Response.json({ ignored: event.type });
  }
}

async function onPaid(session: Stripe.Checkout.Session): Promise<Response> {
  const supabase = db();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      purchaser_email: session.customer_details?.email ?? null,
      // Needed to refund later: you can refund a payment intent, not a
      // Checkout Session. Captured here because this is the only moment
      // Stripe hands it to us without another API call.
      stripe_payment_intent_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
    })
    .eq("stripe_session_id", session.id)
    .select("id, cancel_token, purchaser_email")
    .maybeSingle();

  if (orderError) {
    // Let Stripe retry, this is a transient database problem, not bad data.
    console.error("Failed to mark order paid", orderError);
    return new Response("Could not record payment", { status: 500 });
  }

  if (!order) {
    // Nothing to attach the payment to. Returning 200 stops Stripe retrying
    // an event that can never succeed; the log is the signal for a human.
    console.error("checkout.session.completed matched no order", {
      sessionId: session.id,
    });
    return Response.json({ ok: true, unmatched: true });
  }

  // The status predicate is the idempotency guard: on a replay the letters
  // are already 'scheduled', this matches nothing, and no second email goes
  // out on the back of it.
  const { data: promoted, error: letterError } = await supabase
    .from("letters")
    .update({ status: "scheduled" })
    .eq("order_id", order.id)
    .eq("status", "pending_payment")
    .select("deliver_on, recipient");

  if (letterError) {
    console.error("Failed to schedule letters", letterError);
    return new Response("Could not schedule letter", { status: 500 });
  }

  const letters = promoted ?? [];
  if (letters.length === 0) {
    return Response.json({ ok: true, replay: true });
  }

  const to = session.customer_details?.email ?? order.purchaser_email;
  if (to) {
    // sendEmail never throws. The payment has already succeeded and the
    // letters are already scheduled, so a mail provider outage must not turn
    // this into a 500 and have Stripe retry a paid order.
    await sendEmail(
      to,
      confirmationEmail({
        deliverOn: letters[0].deliver_on as string,
        recipients: letters.map((l) => l.recipient as Recipient),
        cancelToken: order.cancel_token as string,
      }),
    );
  } else {
    console.error("Paid order has no email address", { orderId: order.id });
  }

  return Response.json({ ok: true, scheduled: letters.length });
}

/**
 * An abandoned checkout. The letter was sealed and stored before the
 * redirect, so without this it sits encrypted in the table forever, unpaid
 * and unreachable, personal data kept with no purpose left to serve.
 */
async function onExpired(session: Stripe.Checkout.Session): Promise<Response> {
  const { data: order, error } = await db()
    .from("orders")
    .select("id, status")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (error) {
    console.error("Could not look up expired session", error);
    return new Response("Lookup failed", { status: 500 });
  }

  // An order that is already paid is not ours to erase, whatever Stripe says
  // about the session.
  if (!order || order.status !== "pending") {
    return Response.json({ ok: true, ignored: "not pending" });
  }

  const erased = await eraseLetters(order.id);
  return Response.json({ ok: true, erased: erased.length });
}

/**
 * A refund issued outside this application, in the Stripe dashboard, say.
 * Without this the money goes back and the letter is still posted on the
 * day, which is the one outcome a refund is meant to prevent.
 */
async function onRefunded(charge: Stripe.Charge): Promise<Response> {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : (charge.payment_intent?.id ?? null);

  if (!paymentIntentId) {
    return Response.json({ ok: true, ignored: "no payment intent" });
  }

  const supabase = db();
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (error) {
    console.error("Could not look up refunded charge", error);
    return new Response("Lookup failed", { status: 500 });
  }

  if (!order) {
    console.error("Refund matched no order", { paymentIntentId });
    return Response.json({ ok: true, unmatched: true });
  }

  // No refund call here: Stripe has already moved the money. This side only
  // has to stop the letter and record what happened.
  const erased = await eraseLetters(order.id);

  if (order.status !== "refunded") {
    await supabase
      .from("orders")
      .update({ status: "refunded" })
      .eq("id", order.id);
  }

  return Response.json({ ok: true, erased: erased.length });
}
