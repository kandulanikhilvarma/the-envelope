import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-20 sm:px-6 sm:py-28">
      <p className="eyebrow">Page not found</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
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
              className="link"
            >
              Write a letter
            </Link>
          </li>
          <li>
            <Link
              href="/cancel"
              className="link"
            >
              Cancel a letter you have already sealed
            </Link>
          </li>
          <li>
            <Link
              href="/promise"
              className="link"
            >
              Read our wind-down promise
            </Link>
          </li>
        </ul>
      </nav>
    </main>
  );
}
