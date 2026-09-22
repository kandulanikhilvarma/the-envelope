import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Not found — The Envelope",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-24">
      <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
        There is nothing at this address.
      </h1>
      <p className="mt-5 text-lg text-muted">
        The page may have moved, or the link may have been mistyped.
      </p>

      <nav aria-label="Where to go instead" className="mt-10">
        <ul className="space-y-3">
          <li>
            <Link
              href="/write"
              className="text-seal underline-offset-4 hover:underline"
            >
              Write a letter
            </Link>
          </li>
          <li>
            <Link
              href="/cancel"
              className="text-seal underline-offset-4 hover:underline"
            >
              Cancel a letter you have already sealed
            </Link>
          </li>
          <li>
            <Link
              href="/promise"
              className="text-seal underline-offset-4 hover:underline"
            >
              Read our wind-down promise
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
