import type { Metadata } from "next";
import Link from "next/link";
import { HORIZON_MAX_YEARS } from "@/lib/letters.ts";
import { breakdown, formatEur } from "@/lib/pricing.ts";

export const metadata: Metadata = {
  title: "Terms — The Envelope",
  description: "What we promise, what we do not, and what you can ask for.",
};

/**
 * OPERATOR: have a German e-commerce lawyer read this before launch. The
 * cancellation section reflects the conservative reading recorded in the
 * classification note — we honour a withdrawal window regardless of whether
 * the sale is finally classified as goods or as a service.
 */
const OPERATOR = "[Operator legal name]";
const CONTACT = "[contact email]";

export default function TermsPage() {
  return (
    <>
      <header className="border-b border-line">
        <div className="mx-auto w-full max-w-2xl px-4 py-5">
          <Link href="/" className="font-display text-xl tracking-tight">
            The Envelope
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-14">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          Terms
        </h1>
        <p className="mt-5 text-lg text-muted">
          Short, because the product is simple: you write a letter, we hold it,
          we post it on a date you pick.
        </p>

        <section className="mt-10">
          <h2 className="font-display text-xl">Who you are contracting with</h2>
          <p className="mt-2 text-muted">
            {OPERATOR}. Details in the{" "}
            <Link
              href="/imprint"
              className="text-seal underline-offset-4 hover:underline"
            >
              Impressum
            </Link>
            ; questions to {CONTACT}.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl">What you are buying</h2>
          <p className="mt-2 text-muted">
            One printed letter, sealed and posted on the date you choose, for{" "}
            {formatEur(breakdown("single").grossCents)}, or a pair for{" "}
            {formatEur(breakdown("pair").grossCents)}. Prices include German
            VAT at 19%. One payment, no subscription, nothing recurring.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl">
            The {HORIZON_MAX_YEARS}-year limit
          </h2>
          <p className="mt-2 text-muted">
            We will not accept a delivery date more than {HORIZON_MAX_YEARS}{" "}
            years away. This is deliberate. Postage prices and small businesses
            both change more over a decade than people expect, and we would
            rather decline a promise than break one.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl">Cancelling</h2>
          <p className="mt-2 text-muted">
            You can cancel any letter that has not yet been posted, for any
            reason, using the reference from your confirmation page. We delete
            the letter and refund what you paid. Once a letter has gone to the
            printers it cannot be recalled.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl">
            The address is yours to keep right
          </h2>
          <p className="mt-2 text-muted">
            We post to the address you gave us. If someone has moved by the
            delivery date, the letter goes wherever that address now leads. We
            email you before posting so you can correct it, but we cannot know
            an address has gone stale on our own.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl">What you may not send</h2>
          <p className="mt-2 text-muted">
            Letters are for you, or for someone who would want to hear from
            you. Do not use this to send threatening, harassing or unlawful
            material, or to disclose someone else&rsquo;s private information to
            a third party. We will refuse and refund anything of that kind.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl">If something goes wrong</h2>
          <p className="mt-2 text-muted">
            If we fail to post your letter, you get your money back. We cannot
            be responsible for what the postal service does once the letter has
            been handed over, and we cannot reproduce a letter after it has
            been sent or cancelled, because we no longer hold a readable copy.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl">If we close</h2>
          <p className="mt-2 text-muted">
            Undelivered letters are posted early or returned to you. See the{" "}
            <Link
              href="/promise"
              className="text-seal underline-offset-4 hover:underline"
            >
              wind-down promise
            </Link>
            .
          </p>
        </section>

        <p className="mt-12">
          <Link href="/" className="text-seal underline-offset-4 hover:underline">
            Back to the start
          </Link>
        </p>
      </main>
    </>
  );
}
