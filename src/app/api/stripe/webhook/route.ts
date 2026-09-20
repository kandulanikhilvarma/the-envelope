import type Stripe from "stripe";
import { db } from "@/lib/db.ts";
import { parseWebhookEvent } from "@/lib/stripe.ts";

/**
 * Stripe webhook.
 *
 * Idempotency is enforced by the database, not by this handler: `orders`
 * has a unique constraint on stripe_session_id, and the letter is only
 * promoted out of 'pending_payment' once. Stripe retries the same event on
 * any non-2xx, so a replay must be a no-op rather than a second order.
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
    // A bad signature is not our bug to retry — refuse it and stop.
    const message = error instanceof Error ? error.message : "invalid";
    return new Response(`Signature verification failed: ${message}`, {
      status: 400,
    });
  }

  if (event.type !== "checkout.session.completed") {
    return Response.json({ ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const letterId = session.metadata?.letter_id;

  if (!letterId) {
    // Nothing to attach the payment to. Returning 200 stops Stripe retrying
    // an event that can never succeed; the log is the signal for a human.
    console.error("checkout.session.completed without letter metadata", {
      sessionId: session.id,
    });
    return Response.json({ ok: true, unmatched: true });
  }

  const supabase = db();

  const { error: orderError } = await supabase
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
    .eq("stripe_session_id", session.id);

  if (orderError) {
    // Let Stripe retry — this is a transient database problem, not bad data.
    console.error("Failed to mark order paid", orderError);
    return new Response("Could not record payment", { status: 500 });
  }

  // The status predicate is the idempotency guard: on a replay the letter is
  // already 'scheduled' and this matches nothing.
  const { error: letterError } = await supabase
    .from("letters")
    .update({ status: "scheduled" })
    .eq("id", letterId)
    .eq("status", "pending_payment");

  if (letterError) {
    console.error("Failed to schedule letter", letterError);
    return new Response("Could not schedule letter", { status: 500 });
  }

  return Response.json({ ok: true });
}
