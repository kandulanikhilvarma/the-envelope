import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import Stripe from "stripe";
import { parseWebhookEvent } from "./stripe.ts";

/**
 * Real signature verification, not a mock. Stripe's SDK can produce a valid
 * signature header for a known secret, so the same HMAC path that runs in
 * production runs here — only the secret is fake.
 *
 * What this cannot cover: that Stripe's live servers send what we expect.
 * That needs `stripe listen` against a real account.
 */

const SECRET = "whsec_test_00000000000000000000000000000000";
const signer = new Stripe("sk_test_unused");

function sign(
  payload: string,
  opts: { secret?: string; timestamp?: number } = {},
) {
  return signer.webhooks.generateTestHeaderString({
    payload,
    secret: opts.secret ?? SECRET,
    timestamp: opts.timestamp,
  });
}

function sessionCompleted(sessionId: string, orderId: string): string {
  return JSON.stringify({
    id: "evt_test_1",
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        object: "checkout.session",
        metadata: { order_id: orderId, sku: "single" },
        customer_details: { email: "buyer@example.test" },
      },
    },
  });
}

beforeEach(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_unused";
  process.env.STRIPE_WEBHOOK_SECRET = SECRET;
});

afterEach(() => {
  delete process.env.STRIPE_WEBHOOK_SECRET;
});

describe("parseWebhookEvent", () => {
  it("accepts a correctly signed payload", () => {
    const orderId = "11111111-1111-1111-1111-111111111111";
    const payload = sessionCompleted("cs_test_1", orderId);

    const event = parseWebhookEvent(payload, sign(payload));

    assert.equal(event.type, "checkout.session.completed");
    const session = event.data.object as Stripe.Checkout.Session;
    assert.equal(session.metadata?.order_id, orderId);
  });

  it("rejects a payload signed with a different secret", () => {
    const payload = sessionCompleted(
      "cs_test_2",
      "22222222-2222-2222-2222-222222222222",
    );
    const header = sign(payload, { secret: "whsec_someone_elses_secret" });

    assert.throws(() => parseWebhookEvent(payload, header), /signature/i);
  });

  // The reason the route reads request.text() rather than re-serialising:
  // any change to the bytes invalidates the signature.
  it("rejects a payload mutated after signing", () => {
    const payload = sessionCompleted(
      "cs_test_3",
      "33333333-3333-3333-3333-333333333333",
    );
    const header = sign(payload);
    const tampered = payload.replace("cs_test_3", "cs_test_9");

    assert.throws(() => parseWebhookEvent(tampered, header), /signature/i);
  });

  it("rejects a re-serialised payload even when semantically identical", () => {
    const payload = sessionCompleted(
      "cs_test_4",
      "44444444-4444-4444-4444-444444444444",
    );
    const header = sign(payload);
    const reserialised = JSON.stringify(JSON.parse(payload), null, 2);

    assert.throws(() => parseWebhookEvent(reserialised, header), /signature/i);
  });

  it("rejects a replayed signature outside the tolerance window", () => {
    const payload = sessionCompleted(
      "cs_test_5",
      "55555555-5555-5555-5555-555555555555",
    );
    const longAgo = Math.floor(Date.now() / 1000) - 60 * 60 * 24;

    assert.throws(
      () => parseWebhookEvent(payload, sign(payload, { timestamp: longAgo })),
      /timestamp|tolerance/i,
    );
  });

  it("rejects an empty or malformed signature header", () => {
    const payload = sessionCompleted(
      "cs_test_6",
      "66666666-6666-6666-6666-666666666666",
    );

    assert.throws(() => parseWebhookEvent(payload, ""));
    assert.throws(() => parseWebhookEvent(payload, "t=1,v1=deadbeef"));
  });

  it("refuses to run without a configured webhook secret", () => {
    const payload = sessionCompleted(
      "cs_test_7",
      "77777777-7777-7777-7777-777777777777",
    );
    const header = sign(payload);
    delete process.env.STRIPE_WEBHOOK_SECRET;

    assert.throws(
      () => parseWebhookEvent(payload, header),
      /STRIPE_WEBHOOK_SECRET is not set/,
    );
  });
});
