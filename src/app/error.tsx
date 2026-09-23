"use client";

import Link from "next/link";

/**
 * The error boundary for every page under app/.
 *
 * It shows the digest and nothing else. An error on this site can have a
 * letter body, a recipient address or a Stripe id somewhere in its message,
 * and none of that belongs on a screen, the digest is enough to find the
 * matching server log.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-20 sm:px-6 sm:py-28">
      <p className="eyebrow">Unexpected error</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        Something went wrong at our end.
      </h1>
      <p className="mt-5 text-lg text-muted">
        Nothing you wrote has been lost, and if you were partway through
        paying, nothing has been charged twice. Try again in a moment.
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={reset}
          className="btn btn-primary"
        >
          Try again
        </button>
        <Link
          href="/"
          className="btn btn-secondary"
        >
          Back to the start
        </Link>
      </div>

      {error.digest ? (
        <p className="mt-10 text-sm text-muted">
          If you write to us, quote this reference:{" "}
          <span className="font-mono">{error.digest}</span>
        </p>
      ) : null}
    </main>
  );
}
