import type { IsoDate } from "./letters.ts";

/**
 * A one-event iCalendar file (RFC 5545) so the writer can put the posting
 * date in their own calendar. Built in the browser from data already on the
 * confirmation page; nothing is sent anywhere.
 */

/** RFC 5545 §3.3.11: backslash, semicolon, comma and newline are escaped. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function compactDate(iso: IsoDate): string {
  return iso.replaceAll("-", "");
}

function nextDay(iso: IsoDate): IsoDate {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

export function letterCalendarFile(opts: {
  deliverOn: IsoDate;
  summary: string;
  description: string;
  uid: string;
  now?: Date;
}): string {
  const stamp = (opts.now ?? new Date())
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//The Envelope//Letter date//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${opts.uid}`,
    `DTSTAMP:${stamp}`,
    // An all-day event: DTEND is exclusive, so it is the following day.
    `DTSTART;VALUE=DATE:${compactDate(opts.deliverOn)}`,
    `DTEND;VALUE=DATE:${compactDate(nextDay(opts.deliverOn))}`,
    `SUMMARY:${escapeText(opts.summary)}`,
    `DESCRIPTION:${escapeText(opts.description)}`,
    "TRANSP:TRANSPARENT",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
