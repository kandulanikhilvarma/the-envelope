import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Your letter is sealed — The Envelope",
  robots: { index: false },
};

export default function WrittenPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-24 text-center">
      <h1 className="font-display text-4xl tracking-tight">
        It&rsquo;s sealed.
      </h1>
      <p className="mt-5 text-lg text-muted">
        Your letter is encrypted and waiting. We&rsquo;ll print and post it on
        the morning of the date you chose, and email you shortly before so you
        can correct the address if it has changed.
      </p>
      <p className="mt-4 text-muted">
        Nothing else is needed from you. Keep the receipt Stripe emailed — it
        has the reference if you ever want to cancel.
      </p>
      <p className="mt-10">
        <Link href="/" className="text-seal underline-offset-4 hover:underline">
          Back to the start
        </Link>
      </p>
    </main>
  );
}
