import type { Metadata } from "next";
import { LockIcon } from "@/components/icons.tsx";
import { countryOptions } from "@/lib/countries.ts";
import { ManageForm } from "./manage-form.tsx";

export const metadata: Metadata = {
  title: "Manage your letter",
  description: "Check your sealed letter’s status and update its address before printing.",
  robots: { index: false, follow: false },
};

// THESIS: a private custody ledger, each letter with its own status and destination.
// OWN-WORLD: incumbent stationery, serif typography, oxblood actions and sage states.
// STORY: enter a reference, check the record, correct an address before printing.
// FIRST VIEWPORT: clear purpose, private reference form and the sealed-content promise.
// FORM: vertical custody records with inline address editing; candidate 6, seed 022935f6.
export default function ManagePage() {
  return (
    <main className="flex-1">
      <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-2xl">
          <h1 className="font-display text-4xl tracking-tight text-balance sm:text-5xl">
            Life moves. Your letter follows.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Check where your sealed letter is in its journey, or give it a new
            address. Use the private reference from your confirmation email.
          </p>
          <p className="mt-4 flex items-start gap-2 text-sm text-muted">
            <LockIcon className="mt-0.5 size-4 shrink-0 text-seal" />
            Your words stay sealed. Only the posting details appear here.
          </p>
        </div>
        <ManageForm countries={countryOptions()} />
      </div>
    </main>
  );
}
