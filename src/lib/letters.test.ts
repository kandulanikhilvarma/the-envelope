import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  BODY_MAX_CHARS,
  defaultDeliverOn,
  maxDeliverOn,
  validateBody,
  validateDeliverOn,
  validateDraft,
  validateRecipient,
} from "./letters.ts";

const TODAY = "2026-06-01";

describe("validateDeliverOn", () => {
  it("accepts a date inside the horizon", () => {
    const result = validateDeliverOn("2027-06-01", TODAY);
    assert.equal(result.ok && result.value, "2027-06-01");
  });

  it("accepts exactly the five-year boundary", () => {
    assert.equal(validateDeliverOn("2031-06-01", TODAY).ok, true);
  });

  it("rejects one day past the boundary", () => {
    const result = validateDeliverOn("2031-06-02", TODAY);
    assert.equal(result.ok, false);
    assert.match((result as { message: string }).message, /5 years/);
  });

  it("rejects today and the past", () => {
    assert.equal(validateDeliverOn(TODAY, TODAY).ok, false);
    assert.equal(validateDeliverOn("2020-01-01", TODAY).ok, false);
  });

  it("rejects a date that does not exist", () => {
    const result = validateDeliverOn("2027-02-31", TODAY);
    assert.equal(result.ok, false);
    assert.match((result as { message: string }).message, /does not exist/);
  });

  it("rejects malformed input", () => {
    for (const bad of ["", "tomorrow", "01/06/2027", "2027-6-1"]) {
      assert.equal(validateDeliverOn(bad, TODAY).ok, false, bad);
    }
  });

  it("never lets a leap day roll into a date that does not exist", () => {
    // 2028-02-29 + 5 years would be 2033-02-29, which is not a real date.
    assert.equal(maxDeliverOn("2028-02-29"), "2033-03-01");
  });
});

describe("horizon helpers", () => {
  it("defaults to twelve months out", () => {
    assert.equal(defaultDeliverOn(TODAY), "2027-06-01");
  });

  it("the default always falls inside the maximum", () => {
    assert.equal(validateDeliverOn(defaultDeliverOn(TODAY), TODAY).ok, true);
  });
});

describe("validateBody", () => {
  it("trims and keeps the text", () => {
    const result = validateBody("  hello  ");
    assert.equal(result.ok && result.value, "hello");
  });

  it("rejects empty or whitespace-only text", () => {
    assert.equal(validateBody("").ok, false);
    assert.equal(validateBody("   \n  ").ok, false);
  });

  it("accepts the maximum length and rejects one over", () => {
    assert.equal(validateBody("a".repeat(BODY_MAX_CHARS)).ok, true);
    assert.equal(validateBody("a".repeat(BODY_MAX_CHARS + 1)).ok, false);
  });
});

describe("validateRecipient", () => {
  const valid = {
    name: "Ana Meyer",
    line1: "Hauptstrasse 4",
    postcode: "10115",
    city: "Berlin",
    country: "de",
  };

  it("accepts a complete address and uppercases the country", () => {
    const result = validateRecipient(valid);
    assert.equal(result.ok && result.value.country, "DE");
  });

  it("omits line2 when it is blank", () => {
    const result = validateRecipient({ ...valid, line2: "   " });
    assert.equal(result.ok && "line2" in result.value, false);
  });

  it("keeps line2 when given", () => {
    const result = validateRecipient({ ...valid, line2: "Apt 3" });
    assert.equal(result.ok && result.value.line2, "Apt 3");
  });

  it("names the missing field", () => {
    const result = validateRecipient({ ...valid, city: "" });
    assert.equal(result.ok, false);
    assert.equal((result as { field: string }).field, "city");
  });

  it("rejects a country that is not two letters", () => {
    assert.equal(validateRecipient({ ...valid, country: "Germany" }).ok, false);
  });
});

describe("validateDraft", () => {
  const draft = {
    body: "See you in a year.",
    deliverOn: "2027-06-01",
    recipient: {
      name: "Ana Meyer",
      line1: "Hauptstrasse 4",
      postcode: "10115",
      city: "Berlin",
      country: "DE",
    },
  };

  it("accepts a complete draft", () => {
    const result = validateDraft(draft, TODAY);
    assert.equal(result.ok, true);
    assert.equal(result.ok && result.value.recipient.city, "Berlin");
  });

  it("reports the body before the date", () => {
    const result = validateDraft(
      { ...draft, body: "", deliverOn: "nope" },
      TODAY,
    );
    assert.equal((result as { field: string }).field, "body");
  });

  it("rejects a draft that is over the horizon", () => {
    assert.equal(validateDraft({ ...draft, deliverOn: "2099-01-01" }, TODAY).ok, false);
  });

  it("rejects missing input entirely", () => {
    assert.equal(validateDraft({}, TODAY).ok, false);
  });
});
