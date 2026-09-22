import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Provider identification under §5 DDG.",
};

/**
 * OPERATOR: THIS PAGE IS A LEGAL REQUIREMENT, NOT A FORMALITY.
 *
 * §5 DDG (which replaced §5 TMG in May 2024) requires a German commercial site to publish provider
 * identification that is easy to find and always reachable. Missing or
 * incomplete details are a common target for Abmahnung, formal warning
 * letters that carry costs, and this is one of the cheapest legal risks to
 * remove.
 *
 * Every bracketed value below must be replaced with real information before
 * launch. Do not ship this page as it stands.
 */
const DETAILS = [
  ["Name", "[Full legal name of the operator]"],
  ["Address", "[Street and number; a PO box is not sufficient]"],
  ["Postcode and city", "[Postcode, city]"],
  ["Country", "Germany"],
  ["Email", "[contact email]"],
  ["Telephone", "[telephone number]"],
  ["VAT ID (USt-IdNr.)", "[if you have one, §27a UStG]"],
  ["Responsible for content", "[name, if different from above]"],
] as const;

export default function ImprintPage() {
  return (
    <>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16 sm:px-6 sm:py-20">
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
          Impressum
        </h1>
        <p className="mt-3 text-sm text-muted">
          Angaben gemäß §5 DDG: provider identification.
        </p>

        <dl className="mt-10 space-y-4">
          {DETAILS.map(([label, value]) => (
            <div key={label} className="border-b border-line pb-3">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="mt-1">{value}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-10">
          <h2 className="font-display text-xl">Online dispute resolution</h2>
          <p className="mt-2 text-muted">
            The European Commission provides a platform for online dispute
            resolution at{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              className="link"
              rel="noreferrer"
            >
              ec.europa.eu/consumers/odr
            </a>
            . We are neither obliged nor willing to take part in dispute
            resolution proceedings before a consumer arbitration board.
          </p>
        </section>

        <p className="mt-12">
          <Link href="/" className="link">
            Back to the start
          </Link>
        </p>
      </main>
    </>
  );
}
