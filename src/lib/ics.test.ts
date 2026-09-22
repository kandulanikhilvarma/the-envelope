import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { letterCalendarFile } from "./ics.ts";

const file = (deliverOn: string, summary = "Letter posted") =>
  letterCalendarFile({
    deliverOn,
    summary,
    description: "The Envelope",
    uid: "test@the-envelope",
    now: new Date("2026-09-23T10:11:12.345Z"),
  });

describe("letterCalendarFile", () => {
  it("is an all-day event ending on the following day", () => {
    const ics = file("2027-12-31");
    assert.match(ics, /\r\nDTSTART;VALUE=DATE:20271231\r\n/);
    assert.match(ics, /\r\nDTEND;VALUE=DATE:20280101\r\n/);
    assert.match(ics, /\r\nDTSTAMP:20260923T101112Z\r\n/);
  });

  it("escapes the characters RFC 5545 reserves", () => {
    const ics = file("2027-06-01", "Mira, Jonas; a\\b\nline");
    assert.match(ics, /SUMMARY:Mira\\, Jonas\\; a\\\\b\\nline\r\n/);
  });

  it("uses CRLF line endings throughout", () => {
    const lines = file("2027-06-01").split("\n");
    assert.equal(
      lines.every((l) => l === "" || l.endsWith("\r")),
      true,
    );
  });
});
