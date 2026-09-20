import type { Metadata } from "next";
import Link from "next/link";
import { HORIZON_MAX_YEARS } from "@/lib/letters.ts";

export const metadata: Metadata = {
  title: "Privacy — The Envelope",
  description:
    "What we store, why, how long for, and how to make us delete it.",
};

/**
 * OPERATOR: the bracketed values below are the only things missing. A German
 * e-commerce lawyer should read this before launch — the structure follows
 * GDPR Art. 13, but "follows the structure" is not the same as "is correct
 * for your business".
 */
const OPERATOR = "[Operator legal name]";
const CONTACT = "[contact email]";

export default function PrivacyPage() {
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
          Privacy
        </h1>
        <p className="mt-5 text-lg text-muted">
          You are handing us something private and asking us to keep it for a
          long time. This says exactly what we hold and what we do with it.
        </p>

        <section className="mt-10">
          <h2 className="font-display text-xl">Who is responsible</h2>
          <p className="mt-2 text-muted">
            {OPERATOR}, contactable at {CONTACT}. See our{" "}
            <Link
              href="/imprint"
              className="text-seal underline-offset-4 hover:underline"
            >
              Impressum
            </Link>
            .
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl">What we store</h2>
          <dl className="mt-3 space-y-4 text-muted">
            <div>
              <dt className="text-ink">Your letter</dt>
              <dd>
                Encrypted with AES-256-GCM before it touches the database. We
                decrypt it once, on the day we print it. Nobody reads it in
                between, and it never appears in our logs.
              </dd>
            </div>
            <div>
              <dt className="text-ink">The delivery address</dt>
              <dd>
                Stored in plain form, because we have to print it on an
                envelope.
              </dd>
            </div>
            <div>
              <dt className="text-ink">Your order</dt>
              <dd>
                The amount, the VAT, the date, and the reference Stripe gives
                us. We never see or store your card details — Stripe handles
                the payment and the number never reaches us.
              </dd>
            </div>
            <div>
              <dt className="text-ink">Your consent</dt>
              <dd>
                Which confirmations you ticked, which version of the wording
                you saw, and the IP address and browser that submitted them. We
                have to be able to prove you agreed.
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl">
            Letters often contain sensitive things
          </h2>
          <p className="mt-2 text-muted">
            People write about health, grief, faith and relationships. Under
            Article 9 GDPR that is special-category data, which needs your
            explicit consent — that is the first checkbox at checkout, and it
            is why it is not pre-ticked.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl">How long we keep it</h2>
          <p className="mt-2 text-muted">
            Your letter until its delivery date, and at most{" "}
            {HORIZON_MAX_YEARS} years. That cap is the reason this is a
            defensible retention period rather than an open-ended one. Order
            and invoice records are kept as long as German tax law requires,
            which is longer than the letter itself.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl">Who else sees it</h2>
          <p className="mt-2 text-muted">
            Supabase hosts the database, Vercel runs the site, Stripe takes the
            payment, and Pingen prints and posts the letter via Deutsche Post.
            Pingen receives the finished letter and the address because they
            print it. Nobody else receives any of it, and we do not sell or
            share anything.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl">Your rights</h2>
          <p className="mt-2 text-muted">
            You can ask for a copy of what we hold, ask us to correct it, or
            ask us to delete it. For deletion you do not need to email anyone:{" "}
            <Link
              href="/cancel"
              className="text-seal underline-offset-4 hover:underline"
            >
              cancel the letter
            </Link>{" "}
            and the encrypted text is destroyed immediately, not merely flagged
            as cancelled. That cannot be undone. You may also complain to a
            supervisory authority.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-display text-xl">If we stop operating</h2>
          <p className="mt-2 text-muted">
            Undelivered letters are posted early or returned, and the stored
            data is destroyed. See our{" "}
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
