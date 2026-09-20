import type { Metadata } from "next";
import Link from "next/link";
import {
  BODY_MAX_CHARS,
  defaultDeliverOn,
  HORIZON_MAX_YEARS,
  maxDeliverOn,
  todayIso,
} from "@/lib/letters.ts";
import { breakdown, formatEur } from "@/lib/pricing.ts";
import { ComposeForm } from "./compose-form.tsx";

export const metadata: Metadata = {
  title: "Write your letter — The Envelope",
  description:
    "Write a letter, choose the date, and we post it on paper on the day.",
};

export default function WritePage() {
  // Computed on the server so the date bounds cannot be edited in the page.
  // The action re-checks them, and a database CHECK backs both up.
  const today = todayIso();

  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-5">
          <Link href="/" className="font-display text-xl tracking-tight">
            The Envelope
          </Link>
          <span className="text-sm text-muted">
            {formatEur(breakdown("single").grossCents)} · one letter
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          Write your letter
        </h1>
        <p className="mt-3 max-w-prose text-muted">
          We seal it, hold it encrypted, and post it on the date you choose —
          any date from tomorrow up to {HORIZON_MAX_YEARS} years out.
        </p>

        <ComposeForm
          defaultDate={defaultDeliverOn(today)}
          maxDate={maxDeliverOn(today)}
          bodyMaxChars={BODY_MAX_CHARS}
          singlePrice={formatEur(breakdown("single").grossCents)}
          pairPrice={formatEur(breakdown("pair").grossCents)}
        />
      </main>
    </>
  );
}
