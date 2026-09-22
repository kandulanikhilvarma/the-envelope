import { open, secretsMatch } from "@/lib/crypto.ts";
import { db, fromBytea, type LetterRow } from "@/lib/db.ts";
import {
  operatorAlertEmail,
  operatorEmail,
  preSendNoticeEmail,
  sendEmail,
} from "@/lib/email.ts";
import type { Recipient } from "@/lib/letters.ts";
import { renderLetterPdf } from "@/lib/pdf.ts";
import { sendLetter } from "@/lib/pingen.ts";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * The daily worker. Two passes, in this order:
 *
 *   1. Notices — email the purchaser a week before their letter goes out, so
 *      a stale address can be corrected. Promised on the compose form, the
 *      confirmation page and the confirmation email.
 *   2. Dispatch — post every letter that has come due.
 *
 * Notices run first so a letter never gets posted in the same run that was
 * supposed to warn about it.
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

/** How far ahead the pre-send notice goes out. */
const NOTICE_LEAD_DAYS = 7;
const NOTICE_BATCH_SIZE = 100;

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
  const notices = await sendNotices(supabase);

  const { data: claimed, error: claimError } = await supabase.rpc(
    "claim_due_letters",
    { batch_size: BATCH_SIZE },
  );

  if (claimError) {
    console.error("Could not claim due letters", claimError);
    return new Response("Claim failed", { status: 500 });
  }

  const letters = (claimed ?? []) as LetterRow[];
  const failures: { letterId: string; message: string }[] = [];
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

      failures.push({ letterId: letter.id, message: message.slice(0, 200) });
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
  const overdueCount = typeof overdue === "number" ? overdue : 0;
  if (overdueCount > 0) {
    console.error(`${overdueCount} letters are overdue`, { overdue });
  }

  // A log nobody reads is not an alert. This is the only message that goes
  // to the operator rather than a customer.
  if (failed > 0 || overdueCount > 0) {
    const to = operatorEmail();
    if (to) {
      await sendEmail(
        to,
        operatorAlertEmail({ sent, failed, overdue: overdueCount, failures }),
      );
    } else {
      console.error("OPERATOR_EMAIL is not set; nobody is being told", {
        failed,
        overdue: overdueCount,
      });
    }
  }

  // Housekeeping: the limiter's rows are transient and nothing else deletes
  // them.
  const { error: sweepError } = await supabase.rpc("sweep_rate_limits");
  if (sweepError) {
    console.error("Could not sweep rate limits", sweepError);
  }

  return Response.json({
    claimed: letters.length,
    sent,
    failed,
    notices,
    overdue: overdueCount,
  });
}

type NoticeRow = {
  letter_id: string;
  deliver_on: string;
  recipient: Recipient;
  purchaser_email: string | null;
  cancel_token: string;
};

/**
 * Emails everyone whose letter goes out within the next week.
 *
 * claim_letters_to_notify stamps notified_at inside the same UPDATE that
 * selects the rows, so two overlapping runs cannot both write to the same
 * person. If the send then fails the stamp is cleared and tomorrow's run
 * tries again: a notice a day late beats the same notice twice.
 *
 * Never throws. A mail outage must not stop letters being posted.
 */
async function sendNotices(
  supabase: SupabaseClient,
): Promise<{ notified: number; failed: number }> {
  const { data, error } = await supabase.rpc("claim_letters_to_notify", {
    lead_days: NOTICE_LEAD_DAYS,
    batch_size: NOTICE_BATCH_SIZE,
  });

  if (error) {
    console.error("Could not claim letters to notify", error);
    return { notified: 0, failed: 0 };
  }

  let notified = 0;
  let failed = 0;

  for (const row of (data ?? []) as NoticeRow[]) {
    if (!row.purchaser_email) {
      // Paid with no email on the order. Nothing to retry, so the claim
      // stands and the letter still goes out on its date.
      console.error("Letter has no address to notify", {
        letterId: row.letter_id,
      });
      failed += 1;
      continue;
    }

    const outcome = await sendEmail(
      row.purchaser_email,
      preSendNoticeEmail({
        deliverOn: row.deliver_on,
        recipient: row.recipient,
        cancelToken: row.cancel_token,
      }),
    );

    if (outcome.sent) {
      notified += 1;
      continue;
    }

    failed += 1;
    await supabase
      .from("letters")
      .update({ notified_at: null })
      .eq("id", row.letter_id);
  }

  return { notified, failed };
}
