/**
 * Lives outside the "use server" module because Next only allows async
 * function exports from one.
 */

/**
 * The consent wording the customer actually agreed to, versioned so the
 * evidence in consent_log still means something years later. Bump this
 * whenever the checkout wording changes.
 */
export const CONSENT_TEXT_VERSION = "2026-09-20.a";

export type ComposeState = { error?: string; field?: string };
