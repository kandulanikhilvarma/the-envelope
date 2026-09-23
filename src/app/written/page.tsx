import type { Metadata } from "next";
import Link from "next/link";
import { WaxSeal } from "@/components/art.tsx";
import { CheckIcon, MailIcon, PrinterIcon } from "@/components/icons.tsx";
import { db } from "@/lib/db.ts";
import type { Recipient } from "@/lib/letters.ts";
import { AddToCalendar, ClearDraft, CopyReference } from "./sealed-actions.tsx";

export const metadata: Metadata = {
  title: "Your letter is sealed",
  robots: { index: false },
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function longDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

const NEXT_STEPS: [typeof MailIcon, string][] = [
  [
    MailIcon,
    "About a week before the date, we email you the address we hold. Reply if it needs correcting.",
  ],
  [
    PrinterIcon,
    "On the morning of the date, your letter is decrypted, printed, sealed and handed to Deutsche Post.",
  ],
];

type Sealed = {
  orderId: string;
  cancelToken: string;
  letters: { deliverOn: string; name: string; city: string }[];
};

/**
 * Stripe sends people here with the session id in the query string. That is
 * the only moment we can hand over the cancel token, because there are no
 * accounts to log back into, so it is shown once, plainly, with an
 * instruction to keep it.
 */
async function lookup(sessionId: unknown): Promise<Sealed | null> {
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    return null;
  }
  const supabase = db();
  const { data: order } = await supabase
    .from("orders")
    .select("id, cancel_token")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (!order) return null;

  const { data: letters } = await supabase
    .from("letters")
    .select("deliver_on, recipient")
    .eq("order_id", order.id)
    .order("created_at");

  return {
    orderId: order.id,
    cancelToken: order.cancel_token,
    letters: (letters ?? []).map((l) => {
      const r = l.recipient as Partial<Recipient>;
      return {
        deliverOn: l.deliver_on as string,
        name: r.name ?? "your recipient",
        city: r.city ?? "",
      };
    }),
  };
}

export default async function WrittenPage({
  searchParams,
}: PageProps<"/written">) {
  const { session_id: sessionId } = await searchParams;
  const sealed = await lookup(sessionId);
  const first = sealed?.letters[0];
  const plural = (sealed?.letters.length ?? 0) > 1;

  return (
    <main className="paper-grain flex-1">
      <ClearDraft />
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="flex justify-center">
          <svg
            viewBox="-50 -50 100 100"
            className="size-28 animate-stamp drop-shadow-md"
            aria-hidden="true"
          >
            <WaxSeal r={40} />
          </svg>
        </div>

        <div className="mt-8 text-center">
          <p className="eyebrow">Payment received</p>
          <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
            {plural ? "Both letters are sealed." : "Your letter is sealed."}
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-muted">
            {first
              ? `We will print and post ${plural ? "them" : "it"} on the morning of ${longDate(first.deliverOn)}.`
              : "We will print and post it on the morning of the date you chose."}{" "}
            A confirmation email is on its way.
          </p>
        </div>

        {sealed?.letters.length ? (
          <ul className="card mt-10 divide-y divide-line">
            {sealed.letters.map((l, i) => (
              <li key={i} className="flex items-center gap-4 px-6 py-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sage-soft text-sage">
                  <CheckIcon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-lg">
                    To {l.name}
                    {l.city ? (
                      <span className="text-muted">, {l.city}</span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted">
                    Posted on {longDate(l.deliverOn)}
                  </p>
                </div>
                <span className="hidden rounded-full bg-sage-soft px-3 py-1 text-xs text-sage sm:inline">
                  Sealed
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {sealed ? (
          <>
            <section className="card mt-6 p-6 sm:p-8">
              <h2 className="font-display text-xl">Keep this reference</h2>
              <p className="mt-2 leading-relaxed text-muted">
                It is the only way to cancel{" "}
                {plural ? "these letters" : "this letter"}, and this page will
                not show it again. A copy is in your confirmation email.
              </p>
              <CopyReference token={sealed.cancelToken} />
              <div className="mt-6 flex flex-wrap items-center gap-4">
                {first ? (
                  <AddToCalendar
                    deliverOn={first.deliverOn}
                    recipients={sealed.letters.map((l) => l.name)}
                    orderId={sealed.orderId}
                  />
                ) : null}
                <Link href="/cancel" className="link text-sm">
                  Changed your mind? Cancel and delete it
                </Link>
              </div>
            </section>

            <section className="mt-12">
              <h2 className="eyebrow">What happens next</h2>
              <ol className="mt-5 space-y-5">
                {NEXT_STEPS.map(([Icon, text]) => (
                  <li key={text} className="flex gap-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full border border-line bg-paper text-seal">
                      <Icon className="size-4" />
                    </span>
                    <p className="pt-1.5 leading-relaxed text-muted">{text}</p>
                  </li>
                ))}
              </ol>
            </section>
          </>
        ) : (
          <p className="card mt-10 p-6 leading-relaxed text-muted">
            Your confirmation email carries the reference you need to cancel.
            If it has not arrived within a few minutes, check your spam folder
            and then contact us. We can resend it to the address you paid
            with, and only to that address.
          </p>
        )}

        <p className="mt-14 text-center">
          <Link href="/" className="link">
            Back to the start
          </Link>
        </p>
      </div>
    </main>
  );
}
