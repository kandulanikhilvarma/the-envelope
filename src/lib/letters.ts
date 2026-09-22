/**
 * Validation for the one thing a customer hands us: a letter, a date, and
 * somewhere to post it.
 *
 * Deliberately dependency-free. This is date arithmetic and string length
 * checks; a schema library would be more code to read, not less.
 */

export const HORIZON_DEFAULT_MONTHS = 12;
export const HORIZON_MAX_YEARS = 5;
export const BODY_MAX_CHARS = 12_000;
export const BODY_MIN_CHARS = 1;

/** ISO YYYY-MM-DD, which is also how Postgres wants a `date`. */
export type IsoDate = string;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export type Recipient = {
  name: string;
  line1: string;
  line2?: string;
  postcode: string;
  city: string;
  /** ISO 3166-1 alpha-2, uppercased. */
  country: string;
};

export type Invalid = { ok: false; field: string; message: string };
export type Valid<T> = { ok: true; value: T };
export type Result<T> = Valid<T> | Invalid;

const invalid = (field: string, message: string): Invalid => ({
  ok: false,
  field,
  message,
});

/**
 * Today in UTC as an ISO date. Letters are day-granular; time zones would
 * only introduce a way for a letter to go out on the wrong date.
 */
export function todayIso(now: Date = new Date()): IsoDate {
  return now.toISOString().slice(0, 10);
}

function addYears(iso: IsoDate, years: number): IsoDate {
  const [y, m, d] = iso.split("-").map(Number);
  // Date.UTC normalises 29 Feb + 5 years to 1 Mar, which is what we want:
  // it can never produce a date that does not exist.
  return new Date(Date.UTC(y + years, m - 1, d)).toISOString().slice(0, 10);
}

export function addMonths(iso: IsoDate, months: number): IsoDate {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1 + months, d)).toISOString().slice(0, 10);
}

/** The date pre-filled in the compose form. */
export function defaultDeliverOn(today: IsoDate = todayIso()): IsoDate {
  return addMonths(today, HORIZON_DEFAULT_MONTHS);
}

/** The earliest date the form will accept (tomorrow), for `min`. */
export function minDeliverOn(today: IsoDate = todayIso()): IsoDate {
  const [y, m, d] = today.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/** The latest date the form will accept, for the `max` attribute. */
export function maxDeliverOn(today: IsoDate = todayIso()): IsoDate {
  return addYears(today, HORIZON_MAX_YEARS);
}

/**
 * The horizon cap. The database enforces this independently; if the two ever
 * disagree the insert fails, which is the correct outcome.
 */
export function validateDeliverOn(
  input: string,
  today: IsoDate = todayIso(),
): Result<IsoDate> {
  if (!ISO_DATE.test(input)) {
    return invalid("deliverOn", "Pick a delivery date.");
  }
  // Rejects real-looking nonsense such as 2027-02-31, which the regex allows.
  const parsed = new Date(`${input}T00:00:00Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== input
  ) {
    return invalid("deliverOn", "That date does not exist.");
  }
  if (input <= today) {
    return invalid("deliverOn", "The delivery date has to be in the future.");
  }
  if (input > maxDeliverOn(today)) {
    return invalid(
      "deliverOn",
      `We only hold letters for ${HORIZON_MAX_YEARS} years. Pick an earlier date.`,
    );
  }
  return { ok: true, value: input };
}

export function validateBody(input: string): Result<string> {
  const trimmed = input.trim();
  if (trimmed.length < BODY_MIN_CHARS) {
    return invalid("body", "Write something first.");
  }
  if (trimmed.length > BODY_MAX_CHARS) {
    return invalid(
      "body",
      `Letters are up to ${BODY_MAX_CHARS.toLocaleString("en")} characters. Yours is ${trimmed.length.toLocaleString("en")}.`,
    );
  }
  return { ok: true, value: trimmed };
}

export function validateRecipient(
  input: Partial<Record<keyof Recipient, unknown>>,
): Result<Recipient> {
  const required = ["name", "line1", "postcode", "city", "country"] as const;

  for (const field of required) {
    const value = input[field];
    if (typeof value !== "string" || value.trim() === "") {
      return invalid(field, "This is needed to post the letter.");
    }
  }

  const country = String(input.country).trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) {
    return invalid("country", "Use a two-letter country code, such as DE.");
  }

  const line2 = typeof input.line2 === "string" ? input.line2.trim() : "";

  return {
    ok: true,
    value: {
      name: String(input.name).trim(),
      line1: String(input.line1).trim(),
      ...(line2 ? { line2 } : {}),
      postcode: String(input.postcode).trim(),
      city: String(input.city).trim(),
      country,
    },
  };
}

export type LetterDraft = {
  body: string;
  deliverOn: IsoDate;
  recipient: Recipient;
};

/** Validates a whole submission, returning the first problem found. */
export function validateDraft(
  input: {
    body?: unknown;
    deliverOn?: unknown;
    recipient?: Partial<Record<keyof Recipient, unknown>>;
  },
  today: IsoDate = todayIso(),
): Result<LetterDraft> {
  const body = validateBody(typeof input.body === "string" ? input.body : "");
  if (!body.ok) return body;

  const deliverOn = validateDeliverOn(
    typeof input.deliverOn === "string" ? input.deliverOn : "",
    today,
  );
  if (!deliverOn.ok) return deliverOn;

  const recipient = validateRecipient(input.recipient ?? {});
  if (!recipient.ok) return recipient;

  return {
    ok: true,
    value: {
      body: body.value,
      deliverOn: deliverOn.value,
      recipient: recipient.value,
    },
  };
}
