import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "./env.ts";

/**
 * Service-role client. Bypasses RLS, so this module must never be imported
 * from a Client Component. Every table has RLS enabled with no permissive
 * policy, which means the anon key reads nothing and all real work happens
 * here, server-side.
 */

let cached: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (cached) return cached;

  cached = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return cached;
}

export type LetterStatus =
  | "pending_payment"
  | "scheduled"
  | "sending"
  | "sent"
  | "retry"
  | "failed"
  | "withdrawn";

export type LetterRow = {
  id: string;
  order_id: string;
  content_ciphertext: string | null; // bytea arrives hex-encoded
  content_iv: string | null;
  key_version: string | null;
  recipient: {
    name: string;
    line1: string;
    line2?: string;
    postcode: string;
    city: string;
    country: string;
  };
  created_on: string;
  deliver_on: string;
  status: LetterStatus;
  attempts: number;
  last_error: string | null;
  pingen_id: string | null;
  sent_at: string | null;
};

/**
 * Postgres returns bytea as `\x<hex>` over PostgREST. Encode on the way in
 * to match, so a round-trip through the database is lossless.
 */
export function toBytea(buffer: Buffer): string {
  return `\\x${buffer.toString("hex")}`;
}

export function fromBytea(value: string): Buffer {
  return Buffer.from(value.startsWith("\\x") ? value.slice(2) : value, "hex");
}
