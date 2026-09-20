import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { breakdown, formatEur, isSku, SKUS, VAT_RATE } from "./pricing.ts";

describe("breakdown", () => {
  it("prices the single letter at EUR 19 gross", () => {
    const { grossCents, netCents, vatCents } = breakdown("single");
    assert.equal(grossCents, 1900);
    assert.equal(vatCents, 303); // 1900 - 1900/1.19
    assert.equal(netCents, 1597);
  });

  it("prices the pair at EUR 29 gross", () => {
    const { grossCents, netCents, vatCents } = breakdown("pair");
    assert.equal(grossCents, 2900);
    assert.equal(vatCents, 463);
    assert.equal(netCents, 2437);
  });

  // The reason net is derived by subtraction rather than rounded on its own.
  it("net and VAT always add back to exactly the gross", () => {
    for (const sku of Object.keys(SKUS) as Array<keyof typeof SKUS>) {
      const { grossCents, netCents, vatCents } = breakdown(sku);
      assert.equal(netCents + vatCents, grossCents, sku);
    }
  });

  it("applies the German standard rate", () => {
    assert.equal(VAT_RATE, 0.19);
    const { netCents, vatCents } = breakdown("single");
    assert.ok(Math.abs(netCents * VAT_RATE - vatCents) < 1);
  });
});

describe("isSku", () => {
  it("accepts the two real SKUs", () => {
    assert.equal(isSku("single"), true);
    assert.equal(isSku("pair"), true);
  });

  it("rejects anything else, including prototype keys", () => {
    assert.equal(isSku("free"), false);
    assert.equal(isSku(""), false);
    assert.equal(isSku("toString"), false);
  });
});

describe("formatEur", () => {
  it("renders whole and fractional amounts", () => {
    assert.equal(formatEur(1900), "€19.00");
    assert.equal(formatEur(303), "€3.03");
  });
});
