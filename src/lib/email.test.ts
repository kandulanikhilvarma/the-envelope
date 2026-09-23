import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  confirmationEmail,
  longDate,
  preSendNoticeEmail,
  sendEmail,
} from "./email.ts";
import type { Recipient } from "./letters.ts";

const ada: Recipient = {
  name: "Ada Lovelace",
  line1: "Torstrasse 1",
  postcode: "10119",
  city: "Berlin",
  country: "DE",
};

const grace: Recipient = {
  name: "Grace Hopper",
  line1: "Torstrasse 1",
  line2: "Hinterhaus, 3. OG",
  postcode: "10119",
  city: "Berlin",
  country: "DE",
};

const TOKEN = "6f9619ff-8b86-d011-b42d-00c04fc964ff";

describe("longDate", () => {
  it("reads the way a person would say it", () => {
    assert.equal(longDate("2027-06-14"), "14 June 2027");
  });

  it("does not drift a day at either end of the year", () => {
    assert.equal(longDate("2027-01-01"), "1 January 2027");
    assert.equal(longDate("2027-12-31"), "31 December 2027");
  });
});

describe("confirmationEmail", () => {
  it("carries the cancel token, because nothing else does", () => {
    const message = confirmationEmail({
      deliverOn: "2027-06-14",
      recipients: [ada],
      cancelToken: TOKEN,
    });

    assert.ok(message.text.includes(TOKEN));
    assert.ok(message.subject.includes("14 June 2027"));
  });

  it("lists both addresses for a pair", () => {
    const message = confirmationEmail({
      deliverOn: "2027-06-14",
      recipients: [ada, grace],
      cancelToken: TOKEN,
    });

    assert.ok(message.text.includes("Ada Lovelace"));
    assert.ok(message.text.includes("Grace Hopper"));
    assert.ok(message.text.includes("Hinterhaus, 3. OG"));
    assert.ok(message.text.includes("Both letters are sealed."));
  });

  it("says one letter when there is one letter", () => {
    const message = confirmationEmail({
      deliverOn: "2027-06-14",
      recipients: [ada],
      cancelToken: TOKEN,
    });

    assert.ok(message.text.includes("Your letter is sealed."));
  });
});

describe("preSendNoticeEmail", () => {
  it("quotes the address in full, correcting it is the point", () => {
    const message = preSendNoticeEmail({
      deliverOn: "2027-06-14",
      recipient: grace,
      cancelToken: TOKEN,
    });

    for (const line of [
      "Grace Hopper",
      "Torstrasse 1",
      "Hinterhaus, 3. OG",
      "10119 Berlin",
      "DE",
    ]) {
      assert.ok(message.text.includes(line), `missing ${line}`);
    }
    assert.ok(message.text.includes(TOKEN));
  });

  it("leaves out the optional line when there is none", () => {
    const message = preSendNoticeEmail({
      deliverOn: "2027-06-14",
      recipient: ada,
      cancelToken: TOKEN,
    });

    // A blank line inside the address block would print as a gap on screen
    // and reads as a missing field.
    assert.ok(!message.text.includes("\n\n10119 Berlin"));
  });
});

describe("sendEmail without a provider", () => {
  const saved = process.env.RESEND_API_KEY;

  beforeEach(() => {
    delete process.env.RESEND_API_KEY;
  });

  afterEach(() => {
    if (saved === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = saved;
  });

  it("reports rather than throws, so no payment path fails on it", async () => {
    const outcome = await sendEmail("someone@example.invalid", {
      subject: "Test",
      text: "Test",
    });

    assert.deepEqual(outcome, { sent: false, reason: "not_configured" });
  });
});
