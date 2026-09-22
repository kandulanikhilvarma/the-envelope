import { optionalEnv, siteUrl } from "./env.ts";
import type { IsoDate, Recipient } from "./letters.ts";

/**
 * Transactional email.
 *
 * Two messages exist, and both are promises the UI already makes: a
 * confirmation carrying the cancel token (the only time the customer is
 * given it besides the confirmation page), and a notice a week before the
 * letter is posted so a stale address can be fixed.
 *
 * Plain text on purpose. A keepsake product has no business sending a
 * marketing-shaped HTML email, and text has nothing to sanitise.
 *
 * The letter body never appears in an email. It is Article 9 material held
 * encrypted for years; putting it through an email provider in cleartext
 * would undo the entire storage design.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type Message = { subject: string; text: string };

export type SendOutcome =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "failed"; detail?: string };

function from(): string {
  return optionalEnv("EMAIL_FROM", "The Envelope <hello@example.invalid>");
}

/**
 * Never throws. Email is a courtesy on every path that calls it — a payment
 * that succeeded must not be reported as failed because a mail provider is
 * down, and a letter must not be blocked from posting for the same reason.
 * Callers decide what a false means for them.
 */
export async function sendEmail(
  to: string,
  message: Message,
): Promise<SendOutcome> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("RESEND_API_KEY is not set; skipping email", {
      subject: message.subject,
    });
    return { sent: false, reason: "not_configured" };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from(),
        to: [to],
        subject: message.subject,
        text: message.text,
      }),
    });

    if (!response.ok) {
      const detail = (await response.text().catch(() => "")).slice(0, 500);
      // No recipient address in the log: it is customer PII and this line
      // ends up in a hosted log drain.
      console.error("Email send failed", {
        status: response.status,
        subject: message.subject,
        detail,
      });
      return { sent: false, reason: "failed", detail };
    }

    return { sent: true };
  } catch (error) {
    console.error("Email send threw", {
      subject: message.subject,
      message: error instanceof Error ? error.message : String(error),
    });
    return { sent: false, reason: "failed" };
  }
}

/**
 * Where operator alerts go. Null means nobody is watching, which is worth
 * saying out loud rather than failing quietly.
 */
export function operatorEmail(): string | null {
  return process.env.OPERATOR_EMAIL || null;
}

/** 2027-06-14 → "14 June 2027". Letters are about dates people recognise. */
export function longDate(iso: IsoDate): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function addressLines(recipient: Recipient): string {
  return [
    recipient.name,
    recipient.line1,
    recipient.line2,
    `${recipient.postcode} ${recipient.city}`,
    recipient.country,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Sent once, by the webhook, after payment clears.
 *
 * The cancel token is in here because there are no accounts: the
 * confirmation page shows it once and this is the only durable copy the
 * customer ends up holding.
 */
export function confirmationEmail(opts: {
  deliverOn: IsoDate;
  recipients: Recipient[];
  cancelToken: string;
}): Message {
  const plural = opts.recipients.length > 1;

  return {
    subject: `Your letter is sealed until ${longDate(opts.deliverOn)}`,
    text: [
      plural ? "Both letters are sealed." : "Your letter is sealed.",
      "",
      `We will print and post ${plural ? "them" : "it"} on ${longDate(opts.deliverOn)}, and write to you about a week beforehand so you can correct the address if it has changed.`,
      "",
      plural ? "Going to:" : "Going to:",
      "",
      opts.recipients.map(addressLines).join("\n\n"),
      "",
      "If you change your mind, this reference cancels and deletes it:",
      "",
      `  ${opts.cancelToken}`,
      "",
      `Use it at ${siteUrl()}/cancel. Keep it somewhere you will find it again — we cannot look it up for you, and anyone who has it can cancel the letter.`,
      "",
      "Cancelling deletes the letter itself, not just its place in the queue, and refunds the payment.",
      "",
      "— The Envelope",
    ].join("\n"),
  };
}

/**
 * Sent once, a week ahead, by the dispatch worker.
 *
 * This is the last chance to change a stale address, so the address we hold
 * is quoted in full — that is the entire point of the email.
 */
export function preSendNoticeEmail(opts: {
  deliverOn: IsoDate;
  recipient: Recipient;
  cancelToken: string;
}): Message {
  return {
    subject: `We post your letter on ${longDate(opts.deliverOn)}`,
    text: [
      `The letter you wrote goes into the post on ${longDate(opts.deliverOn)}.`,
      "",
      "We will send it to:",
      "",
      addressLines(opts.recipient),
      "",
      `If that address is out of date, reply to this email before ${longDate(opts.deliverOn)} and we will correct it.`,
      "",
      "If you would rather it was never sent, this reference deletes it and refunds you:",
      "",
      `  ${opts.cancelToken}`,
      "",
      `${siteUrl()}/cancel`,
      "",
      "We have not read it. It stays encrypted until the morning it is printed.",
      "",
      "— The Envelope",
    ].join("\n"),
  };
}

/**
 * The operator alert the architecture has always called for and the code
 * only ever wrote to a log.
 *
 * A letter that fails to post is silent until the person who wrote it asks
 * why nothing arrived, and a scheduler that stops is silent for longer. This
 * is the one message that goes to the operator rather than a customer.
 *
 * Letter ids and error text only — never a body, never a recipient address.
 */
export function operatorAlertEmail(opts: {
  sent: number;
  failed: number;
  overdue: number;
  failures: { letterId: string; message: string }[];
}): Message {
  const headline =
    opts.overdue > 0
      ? `${opts.overdue} letter(s) overdue`
      : `${opts.failed} letter(s) failed to post`;

  return {
    subject: `The Envelope: ${headline}`,
    text: [
      `Dispatch finished with ${opts.sent} sent and ${opts.failed} failed.`,
      "",
      opts.overdue > 0
        ? `${opts.overdue} letter(s) are past their delivery date and still unsent. Either the scheduler has stopped or Pingen is rejecting everything. Check both.`
        : "No overdue backlog.",
      "",
      opts.failures.length > 0 ? "Failures:" : "",
      ...opts.failures.map((f) => `  ${f.letterId}: ${f.message}`),
      "",
      "Letter bodies and recipient addresses are deliberately not included.",
    ]
      .filter((line, index, all) => line !== "" || all[index - 1] !== "")
      .join("\n"),
  };
}
