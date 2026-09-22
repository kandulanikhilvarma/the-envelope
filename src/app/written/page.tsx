import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db.ts";

export const metadata: Metadata = {
  title: "Your letter is sealed — The Envelope",
  robots: { index: false },
};

/**
 * Stripe sends people here with the session id in the query string. That is
 * the only moment we can hand over the cancel token, because there are no
 * accounts to log back into — so it is shown once, plainly, with an
 * instruction to keep it.
 */
export default async function WrittenPage({
  searchParams,
}: PageProps<"/written">) {
  const { session_id: sessionId } = await searchParams;

  let cancelToken: string | null = null;
  if (typeof sessionId === "string" && sessionId.startsWith("cs_")) {
    const { data } = await db()
      .from("orders")
      .select("cancel_token")
      .eq("stripe_session_id", sessionId)
      .maybeSingle();
    cancelToken = data?.cancel_token ?? null;
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-20">
      <h1 className="font-display text-4xl tracking-tight">
        It&rsquo;s sealed.
      </h1>
      <p className="mt-5 text-lg text-muted">
        Your letter is encrypted and waiting. We&rsquo;ll print and post it on
        the morning of the date you chose, and email you about a week before
        so you can correct the address if it has changed.
      </p>

      {cancelToken ? (
        <div className="mt-10 rounded-sm border border-line bg-surface p-6">
          <h2 className="font-display text-xl">Keep this reference</h2>
          <p className="mt-2 text-muted">
            It is the only way to cancel the letter, and this page will not
            show it to you again. A copy is in your confirmation email.
          </p>
          <p className="mt-4 break-all rounded-sm border border-line bg-bg px-3 py-2 font-mono text-sm">
            {cancelToken}
          </p>
          <p className="mt-4 text-sm text-muted">
            Changed your mind?{" "}
            <Link href="/cancel" className="text-seal underline-offset-4 hover:underline">
              Cancel and delete it
            </Link>
            .
          </p>
        </div>
      ) : (
        <p className="mt-10 text-muted">
          Your confirmation email carries the reference you need to cancel. If
          it has not arrived within a few minutes, check your spam folder and
          then email us — we can send it again to the address you paid with,
          and only to that address.
        </p>
      )}

      <p className="mt-12">
        <Link href="/" className="text-seal underline-offset-4 hover:underline">
          Back to the start
        </Link>
      </p>
    </main>
  );
}
