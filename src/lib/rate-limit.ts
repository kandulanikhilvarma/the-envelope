import { createHash } from "node:crypto";
import { db } from "./db.ts";

/**
 * Rate limiting for the paths a stranger can POST to.
 *
 * The counter is in Postgres, not in memory: this runs on serverless
 * instances, so process state is per-instance and resets constantly, which
 * is not a limit at all.
 *
 * Fails open. A limiter that rejects customers when the database hiccups has
 * turned a minor outage into lost sales; the downside of letting a burst
 * through during that window is smaller.
 */

export type Limit = { action: string; max: number; windowSeconds: number };

/** Five checkouts in ten minutes is well past normal, well short of a wall. */
export const COMPOSE_LIMIT: Limit = {
  action: "compose",
  max: 5,
  windowSeconds: 600,
};

/**
 * Cancelling is idempotent and the token is 122 bits, so this is about load
 * rather than guessing, at ten an hour, brute force would outlast the sun.
 */
export const CANCEL_LIMIT: Limit = {
  action: "cancel",
  max: 10,
  windowSeconds: 3600,
};

/**
 * The bucket key. The IP is hashed, so the table holds no addresses: a
 * rate-limit row is not a place to accumulate personal data, and this one is
 * readable by anything holding the service key.
 */
export function bucketFor(limit: Limit, ip: string): string {
  const digest = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  return `${limit.action}:${digest}`;
}

/**
 * First address in X-Forwarded-For, which on Vercel is the real client.
 *
 * Takes the headers rather than reading them, so this module stays free of
 * next/headers and can be exercised by the test runner.
 *
 * An unrecognisable caller shares one bucket rather than bypassing the limit.
 */
export function callerIp(requestHeaders: Headers): string {
  const forwarded = requestHeaders.get("x-forwarded-for");
  return (
    forwarded?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown"
  );
}

/** True when the caller may proceed. */
export async function withinLimit(
  limit: Limit,
  ip: string,
): Promise<boolean> {
  try {
    const { data, error } = await db().rpc("consume_rate_limit", {
      p_bucket: bucketFor(limit, ip),
      p_limit: limit.max,
      p_window_seconds: limit.windowSeconds,
    });

    if (error) {
      console.error("Rate limit check failed; allowing", {
        action: limit.action,
        error,
      });
      return true;
    }

    return data !== false;
  } catch (error) {
    console.error("Rate limit check threw; allowing", {
      action: limit.action,
      message: error instanceof Error ? error.message : String(error),
    });
    return true;
  }
}
