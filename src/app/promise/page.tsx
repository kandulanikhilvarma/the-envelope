import type { Metadata } from "next";
import Link from "next/link";
import { HORIZON_MAX_YEARS } from "@/lib/letters.ts";

export const metadata: Metadata = {
  title: "Our wind-down promise — The Envelope",
  description:
    "What happens to your letter if The Envelope ever stops operating.",
};

export default function PromisePage() {
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
          Our wind-down promise
        </h1>

        <p className="mt-6 text-lg text-muted">
          You are trusting us with something you cannot replace, for a length
          of time most businesses do not plan for. Here is what we commit to.
        </p>

        <dl className="mt-10 space-y-8">
          <div>
            <dt className="font-display text-xl">
              We cap the wait at {HORIZON_MAX_YEARS} years
            </dt>
            <dd className="mt-2 text-muted">
              Not because longer is technically hard, but because a promise we
              cannot fund is not worth making. Postage prices and small
              businesses both change more over a decade than people expect.
            </dd>
          </div>

          <div>
            <dt className="font-display text-xl">
              If we close, nothing is stranded
            </dt>
            <dd className="mt-2 text-muted">
              Every undelivered letter is either posted early or returned to
              the person who wrote it. We will tell you which, before it
              happens. Letters are not quietly deleted and the service does not
              simply go dark.
            </dd>
          </div>

          <div>
            <dt className="font-display text-xl">
              We do not spend your postage in advance
            </dt>
            <dd className="mt-2 text-muted">
              Printing and postage are paid at the moment your letter is sent,
              not when you buy it. What we hold is a commitment, not money we
              have already spent.
            </dd>
          </div>

          <div>
            <dt className="font-display text-xl">You can change your mind</dt>
            <dd className="mt-2 text-muted">
              Ask us to cancel a pending letter and we delete the letter
              itself, not just its place in the queue. Once it is deleted we
              cannot recover it, which is the point.
            </dd>
          </div>
        </dl>

        <p className="mt-12">
          <Link href="/" className="text-seal underline-offset-4 hover:underline">
            Back to the start
          </Link>
        </p>
      </main>
    </>
  );
}
