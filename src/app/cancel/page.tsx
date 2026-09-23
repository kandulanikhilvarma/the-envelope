import type { Metadata } from "next";
import Link from "next/link";
import { CancelForm } from "./cancel-form.tsx";

export const metadata: Metadata = {
  title: "Cancel a letter",
  description: "Cancel a pending letter and have it deleted.",
  robots: { index: false },
};

export default function CancelPage() {
  return (
    <main className="paper-grain flex-1">
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="eyebrow">Your letter</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
          Cancel a letter
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Enter the reference from your confirmation page or email. We delete
          the letter itself, not only its place in the queue, and refund your
          payment in full.
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          Deletion is permanent. We cannot recover the text afterwards, and
          that is by design.
        </p>

        <CancelForm />

        <p className="mt-10 text-sm leading-relaxed text-muted">
          A letter that has already gone to the printers cannot be stopped. If
          yours has been sent, contact us using the details in the{" "}
          <Link href="/imprint" className="link">
            Impressum
          </Link>{" "}
          and we will tell you what happened to it.
        </p>
      </div>
    </main>
  );
}
