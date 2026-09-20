import type { Metadata } from "next";
import Link from "next/link";
import { CancelForm } from "./cancel-form.tsx";

export const metadata: Metadata = {
  title: "Cancel a letter — The Envelope",
  description: "Cancel a pending letter and have it deleted.",
  robots: { index: false },
};

export default function CancelPage() {
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
          Cancel a letter
        </h1>
        <p className="mt-5 text-muted">
          Paste the reference from your confirmation page. We delete the letter
          itself, not just its place in the queue, and refund what you paid.
        </p>
        <p className="mt-3 text-muted">
          This cannot be undone, and we cannot recover the words afterwards.
          That is the point of it.
        </p>

        <CancelForm />

        <p className="mt-10 text-sm text-muted">
          A letter already handed to the printers cannot be stopped. If yours
          has gone, email us and we will tell you what happened to it.
        </p>
      </main>
    </>
  );
}
