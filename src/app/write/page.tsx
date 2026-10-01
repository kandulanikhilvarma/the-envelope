import type { Metadata } from "next";
import { LockIcon, MailIcon, UndoIcon } from "@/components/icons.tsx";
import {
  BODY_MAX_CHARS,
  defaultDeliverOn,
  HORIZON_MAX_YEARS,
  maxDeliverOn,
  minDeliverOn,
  todayIso,
} from "@/lib/letters.ts";
import { countryOptions } from "@/lib/countries.ts";
import { occasionFor } from "@/lib/occasions.ts";
import { breakdown, formatEur } from "@/lib/pricing.ts";
import { ComposeForm } from "./compose-form.tsx";

export const metadata: Metadata = {
  title: "Write your letter",
  description:
    "Write a letter, choose the date, and we post it on paper on the day.",
};

export default async function WritePage({ searchParams }: PageProps<"/write">) {
  const { occasion, cancelled, sku } = await searchParams;
  const chosen = occasionFor(occasion);

  // Computed per request, not at build time: reading searchParams makes this
  // page dynamic, so the date bounds never go stale between deploys. The
  // action re-checks them, and a database CHECK backs both up.
  const today = todayIso();

  return (
    <main className="flex-1">
      <section className="paper-grain border-b border-line bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
          <p className="eyebrow">
            {occasion ? chosen.title : "A letter for later"}
          </p>
          <h1 className="mt-3 font-display text-4xl tracking-tight text-balance sm:text-5xl">
            Write your letter
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
            We seal it, keep it encrypted, and post it on the date you choose,
            any day from tomorrow up to {HORIZON_MAX_YEARS} years from now.
          </p>
          <ul className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-sm text-muted">
            <li className="flex items-center gap-2">
              <LockIcon className="size-4 text-seal" />
              Encrypted as soon as you submit
            </li>
            <li className="flex items-center gap-2">
              <MailIcon className="size-4 text-seal" />
              Address check one week before posting
            </li>
            <li className="flex items-center gap-2">
              <UndoIcon className="size-4 text-seal" />
              Cancel before printing for a full refund
            </li>
          </ul>
        </div>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        {cancelled ? (
          <p
            role="status"
            className="mb-10 rounded-lg border border-line bg-surface px-5 py-4 text-sm"
          >
            Payment was not completed and nothing was charged. Your letter is
            still here if you wrote it in this tab.
          </p>
        ) : null}

        <ComposeForm
          today={today}
          minDate={minDeliverOn(today)}
          defaultDate={defaultDeliverOn(today)}
          maxDate={maxDeliverOn(today)}
          bodyMaxChars={BODY_MAX_CHARS}
          prices={{
            single: formatEur(breakdown("single").grossCents),
            pair: formatEur(breakdown("pair").grossCents),
          }}
          vat={{
            single: formatEur(breakdown("single").vatCents),
            pair: formatEur(breakdown("pair").vatCents),
          }}
          prompts={chosen.prompts}
          countries={countryOptions()}
          initialSku={sku === "pair" ? "pair" : "single"}
        />
      </div>
    </main>
  );
}
