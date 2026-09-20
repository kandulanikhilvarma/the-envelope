import { db } from "./db.ts";
import { refund } from "./stripe.ts";

/**
 * Cancelling a pending letter.
 *
 * The promise on /promise is specific: cancelling deletes the letter itself,
 * not just its place in the queue. So this nulls the ciphertext rather than
 * only flipping a status — a "deleted" letter still sitting encrypted in a
 * table has not been deleted, and under GDPR erasure that distinction is the
 * whole point.
 *
 * Only letters that have not gone out can be withdrawn. Once a letter is
 * 'sending' or 'sent' it is with Pingen and out of our hands, and pretending
 * otherwise would be a refund for something already delivered.
 */

/** Statuses where nothing has left the building yet. */
export const WITHDRAWABLE = [
  "pending_payment",
  "scheduled",
  "retry",
  "failed",
] as const;

export type WithdrawOutcome =
  | { ok: true; lettersWithdrawn: number; refunded: boolean }
  | { ok: false; reason: "not_found" | "already_sent" | "already_withdrawn" };

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function looksLikeToken(value: string): boolean {
  return UUID.test(value.trim());
}

export async function withdrawByToken(
  rawToken: string,
): Promise<WithdrawOutcome> {
  const token = rawToken.trim();
  if (!looksLikeToken(token)) return { ok: false, reason: "not_found" };

  const supabase = db();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, stripe_payment_intent_id")
    .eq("cancel_token", token)
    .maybeSingle();

  // A wrong token and a missing order give the same answer on purpose: this
  // endpoint must not confirm whether a token exists.
  if (!order) return { ok: false, reason: "not_found" };

  const { data: letters } = await supabase
    .from("letters")
    .select("id, status")
    .eq("order_id", order.id);

  const rows = letters ?? [];
  if (rows.length === 0) return { ok: false, reason: "not_found" };

  if (rows.every((l) => l.status === "withdrawn")) {
    return { ok: false, reason: "already_withdrawn" };
  }
  if (rows.some((l) => l.status === "sending" || l.status === "sent")) {
    return { ok: false, reason: "already_sent" };
  }

  // Destroy the content first. If the refund then fails, the customer is out
  // of pocket until a human fixes it, which is recoverable; leaving a letter
  // readable after promising deletion is not.
  const { data: withdrawn, error: updateError } = await supabase
    .from("letters")
    .update({
      status: "withdrawn",
      content_ciphertext: null,
      content_iv: null,
      key_version: null,
      last_error: null,
    })
    .eq("order_id", order.id)
    .in("status", WITHDRAWABLE)
    .select("id");

  if (updateError) throw updateError;

  let refunded = false;
  if (order.status === "paid" && order.stripe_payment_intent_id) {
    await refund(order.stripe_payment_intent_id);
    refunded = true;
  }

  if (refunded) {
    await supabase
      .from("orders")
      .update({ status: "refunded" })
      .eq("id", order.id);
  }

  return { ok: true, lettersWithdrawn: withdrawn?.length ?? 0, refunded };
}
