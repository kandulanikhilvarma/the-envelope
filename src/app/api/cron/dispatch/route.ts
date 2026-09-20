import { open, secretsMatch } from "@/lib/crypto.ts";
import { db, fromBytea, type LetterRow } from "@/lib/db.ts";
import { renderLetterPdf } from "@/lib/pdf.ts";
import { sendLetter } from "@/lib/pingen.ts";

/**
 * The dispatch worker. Runs daily; posts every letter that has come due.
 *
 * Two things keep a letter from being posted twice:
 *   1. claim_due_letters() flips 'scheduled' -> 'sending' inside a single
 *      UPDATE with FOR UPDATE SKIP LOCKED, so overlapping runs cannot both
 *      claim the same row.
 *   2. Pingen gets the letter id as an idempotency key, so a retry after a
 *      response we never saw does not produce a second posting.
 */

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 5;

/**
 * Vercel Cron calls with GET and `Authorization: Bearer $CRON_SECRET`;
 * pg_cron and manual runs use POST with `x-cron-secret`. Both are accepted
 * so the scheduler can be swapped without touching this route.
 */
function authorized(request: Request): boolean {
  // Deliberately not requireEnv: throwing here produces a 500, which tells
  // an anonymous caller the route exists and is merely broken. A server with
  // no secret configured should refuse everyone and look absent.
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not set; dispatch is refusing all callers");
    return false;
  }

  const bearer = request.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    return secretsMatch(bearer.slice("Bearer ".length), secret);
  }

  const header = request.headers.get("x-cron-secret");
  return header !== null && secretsMatch(header, secret);
}

export async function GET(request: Request): Promise<Response> {
  return dispatch(request);
}

export async function POST(request: Request): Promise<Response> {
  return dispatch(request);
}

async function dispatch(request: Request): Promise<Response> {
  if (!authorized(request)) {
    // 404 rather than 401: an unauthenticated caller learns nothing about
    // whether this path exists.
    return new Response("Not found", { status: 404 });
  }

  const supabase = db();

  const { data: claimed, error: claimError } = await supabase.rpc(
    "claim_due_letters",
    { batch_size: BATCH_SIZE },
  );

  if (claimError) {
    console.error("Could not claim due letters", claimError);
    return new Response("Claim failed", { status: 500 });
  }

  const letters = (claimed ?? []) as LetterRow[];
  let sent = 0;
  let failed = 0;

  for (const letter of letters) {
    try {
      if (
        !letter.content_ciphertext ||
        !letter.content_iv ||
        !letter.key_version
      ) {
        throw new Error("Letter has no content; it may have been withdrawn");
      }

      const body = open({
        ciphertext: fromBytea(letter.content_ciphertext),
        iv: fromBytea(letter.content_iv),
        keyVersion: letter.key_version,
      });

      const pdf = await renderLetterPdf({ body, recipient: letter.recipient });

      const { pingenId } = await sendLetter({
        pdf,
        recipient: letter.recipient,
        idempotencyKey: letter.id,
      });

      await supabase
        .from("letters")
        .update({
          status: "sent",
          pingen_id: pingenId,
          sent_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", letter.id);

      sent += 1;
    } catch (error) {
      // Never log the letter body. Attempts were already incremented by the
      // claim, so a letter that keeps failing eventually stops retrying and
      // waits for a human instead of looping forever.
      const message = error instanceof Error ? error.message : String(error);
      const exhausted = letter.attempts >= MAX_ATTEMPTS;

      console.error("Letter dispatch failed", {
        letterId: letter.id,
        attempts: letter.attempts,
        nextStatus: exhausted ? "failed" : "retry",
        message,
      });

      await supabase
        .from("letters")
        .update({
          status: exhausted ? "failed" : "retry",
          last_error: message.slice(0, 500),
        })
        .eq("id", letter.id);

      failed += 1;
    }
  }

  await supabase
    .from("cron_heartbeat")
    .update({ last_run_at: new Date().toISOString(), last_sent_count: sent })
    .eq("id", true);

  // A backlog means the scheduler stopped or Pingen is rejecting everything.
  // Either way it is silent until someone's letter arrives late.
  const { data: overdue } = await supabase.rpc("overdue_letter_count");
  if (typeof overdue === "number" && overdue > 0) {
    console.error(`${overdue} letters are overdue`, { overdue });
  }

  return Response.json({
    claimed: letters.length,
    sent,
    failed,
    overdue: overdue ?? null,
  });
}
