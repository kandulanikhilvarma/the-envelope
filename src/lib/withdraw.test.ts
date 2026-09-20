import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { looksLikeToken, WITHDRAWABLE } from "./withdraw.ts";

describe("looksLikeToken", () => {
  it("accepts a uuid, with surrounding whitespace", () => {
    assert.equal(looksLikeToken("3f2504e0-4f89-41d3-9a0c-0305e82c3301"), true);
    assert.equal(
      looksLikeToken("  3f2504e0-4f89-41d3-9a0c-0305e82c3301\n"),
      true,
    );
  });

  it("is case-insensitive", () => {
    assert.equal(looksLikeToken("3F2504E0-4F89-41D3-9A0C-0305E82C3301"), true);
  });

  it("rejects anything that is not a uuid", () => {
    for (const bad of [
      "",
      "   ",
      "not-a-token",
      "3f2504e0-4f89-41d3-9a0c",
      "3f2504e04f8941d39a0c0305e82c3301",
      "3f2504e0-4f89-41d3-9a0c-0305e82c3301-extra",
      "' or 1=1 --",
    ]) {
      assert.equal(looksLikeToken(bad), false, bad);
    }
  });
});

describe("WITHDRAWABLE", () => {
  // The guarantee: once a letter is with Pingen it cannot be unsent, so
  // neither state may ever become withdrawable.
  it("excludes anything already handed to Pingen", () => {
    assert.equal(WITHDRAWABLE.includes("sending" as never), false);
    assert.equal(WITHDRAWABLE.includes("sent" as never), false);
  });

  it("covers every state where nothing has been posted yet", () => {
    for (const status of ["pending_payment", "scheduled", "retry", "failed"]) {
      assert.ok(WITHDRAWABLE.includes(status as never), status);
    }
  });

  it("does not list withdrawn, so a repeat cancel is a no-op", () => {
    assert.equal(WITHDRAWABLE.includes("withdrawn" as never), false);
  });
});
