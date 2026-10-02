import type { SupabaseClient } from "@supabase/supabase-js";
import { db, type LetterStatus } from "./db.ts";
import { validateRecipient, type Recipient } from "./letters.ts";
import { ADDRESS_EDITABLE, type AddressState, type ManagedLetter, type ManagedOrder } from "./management.ts";
import { looksLikeToken } from "./withdraw.ts";

const LETTER_FIELDS = "id, deliver_on, status, sent_at, recipient";
const NOT_FOUND = "We could not find letters for that reference. Check the reference in your confirmation email and try again.";

type DeliveryRow = {
  id: string;
  deliver_on: string;
  status: LetterStatus;
  sent_at: string | null;
  recipient: Recipient;
};

function deliveryView(row: DeliveryRow): ManagedLetter {
  return {
    id: row.id,
    deliverOn: row.deliver_on,
    status: row.status,
    sentAt: row.sent_at,
    recipient: row.recipient,
  };
}

/** The reference is authorized afresh for every read and mutation. */
async function orderForToken(token: string, client: SupabaseClient) {
  const { data, error } = await client
    .from("orders")
    .select("id, sku, status")
    .eq("cancel_token", token.trim())
    .maybeSingle();
  if (error) throw new Error("Management lookup failed");
  return data as { id: string; sku: ManagedOrder["sku"]; status: ManagedOrder["status"] } | null;
}

export async function loadManagedOrder(
  token: string,
  client?: SupabaseClient,
): Promise<{ order: ManagedOrder } | { error: string }> {
  if (!looksLikeToken(token)) return { error: NOT_FOUND };
  const supabase = client ?? db();
  const order = await orderForToken(token, supabase);
  if (!order) return { error: NOT_FOUND };

  const { data, error } = await supabase
    .from("letters")
    .select(LETTER_FIELDS)
    .eq("order_id", order.id)
    .order("created_at")
    .order("id");
  if (error) throw new Error("Delivery lookup failed");
  if (!data?.length) return { error: NOT_FOUND };

  return {
    order: {
      sku: order.sku,
      status: order.status,
      letters: (data as DeliveryRow[]).map(deliveryView),
    },
  };
}

export async function updateManagedAddress(
  token: string,
  letterId: string,
  input: Partial<Record<keyof Recipient, unknown>>,
  client?: SupabaseClient,
): Promise<AddressState> {
  if (!looksLikeToken(token) || !looksLikeToken(letterId)) {
    return { error: NOT_FOUND };
  }
  const recipient = validateRecipient(input);
  if (!recipient.ok) return { error: recipient.message, field: recipient.field };

  const supabase = client ?? db();
  const order = await orderForToken(token, supabase);
  if (!order) return { error: NOT_FOUND };
  if (order.status !== "paid") {
    return { error: "Only paid, uncancelled letters can have their address changed.", locked: true };
  }

  // Both ownership and status are part of this single UPDATE, rather than
  // checking status and updating later. If dispatch wins the row lock first,
  // its 'sending' status no longer matches and zero rows are returned. If
  // this wins first, the worker claims the newly saved address.
  const { data, error } = await supabase
    .from("letters")
    .update({ recipient: recipient.value })
    .eq("id", letterId)
    .eq("order_id", order.id)
    .in("status", ADDRESS_EDITABLE)
    .select(LETTER_FIELDS)
    .maybeSingle();
  if (error) throw new Error("Address update failed");
  if (!data) {
    return {
      error: "This address could not be changed. Refresh the status: the letter may have started printing or been cancelled.",
      locked: true,
    };
  }
  return { letter: deliveryView(data as DeliveryRow) };
}
