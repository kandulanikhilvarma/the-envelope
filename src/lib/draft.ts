/**
 * sessionStorage key for the unsent draft on /write.
 *
 * sessionStorage, not localStorage: the draft survives a reload or a
 * cancelled payment in the same tab and is gone when the tab closes. A
 * letter that may hold health or relationship details should not sit in a
 * shared computer's storage indefinitely. /written clears it once paid.
 */
export const DRAFT_KEY = "the-envelope:draft";
