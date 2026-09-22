import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bucketFor,
  callerIp,
  CANCEL_LIMIT,
  COMPOSE_LIMIT,
} from "./rate-limit.ts";

describe("bucketFor", () => {
  it("never contains the address it was built from", () => {
    const bucket = bucketFor(COMPOSE_LIMIT, "203.0.113.42");

    assert.ok(!bucket.includes("203.0.113.42"));
    assert.match(bucket, /^compose:[0-9a-f]{32}$/);
  });

  it("is stable for one caller and different for another", () => {
    assert.equal(
      bucketFor(COMPOSE_LIMIT, "203.0.113.42"),
      bucketFor(COMPOSE_LIMIT, "203.0.113.42"),
    );
    assert.notEqual(
      bucketFor(COMPOSE_LIMIT, "203.0.113.42"),
      bucketFor(COMPOSE_LIMIT, "203.0.113.43"),
    );
  });

  it("separates the two actions, so cancelling cannot exhaust checkout", () => {
    assert.notEqual(
      bucketFor(COMPOSE_LIMIT, "203.0.113.42"),
      bucketFor(CANCEL_LIMIT, "203.0.113.42"),
    );
  });
});

describe("callerIp", () => {
  it("takes the first hop, which on Vercel is the real client", () => {
    const ip = callerIp(
      new Headers({ "x-forwarded-for": "203.0.113.42, 70.41.3.18" }),
    );

    assert.equal(ip, "203.0.113.42");
  });

  it("falls back to x-real-ip, then to one shared bucket", () => {
    assert.equal(callerIp(new Headers({ "x-real-ip": "203.0.113.9" })), "203.0.113.9");
    assert.equal(callerIp(new Headers()), "unknown");
  });
});

describe("limits", () => {
  it("are tight enough to matter and loose enough not to bite", () => {
    assert.ok(COMPOSE_LIMIT.max >= 3 && COMPOSE_LIMIT.max <= 10);
    assert.ok(CANCEL_LIMIT.max >= 5 && CANCEL_LIMIT.max <= 20);
    assert.ok(COMPOSE_LIMIT.windowSeconds > 0);
    assert.ok(CANCEL_LIMIT.windowSeconds > 0);
  });
});
