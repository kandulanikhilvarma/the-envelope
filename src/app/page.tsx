import Link from "next/link";

const HORIZON_MAX_YEARS = 5;

function SealedEnvelope({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 280"
      role="img"
      aria-label="A cream envelope closed with a round wax seal"
      className={className}
    >
      <rect
        x="8"
        y="8"
        width="384"
        height="264"
        rx="6"
        fill="var(--surface)"
        stroke="var(--line)"
        strokeWidth="2"
      />
      <path
        d="M8 20 L200 160 L392 20"
        fill="none"
        stroke="var(--line)"
        strokeWidth="2"
      />
      <path
        d="M8 268 L150 150 M392 268 L250 150"
        stroke="var(--line)"
        strokeWidth="2"
      />
      <circle cx="200" cy="168" r="34" fill="var(--seal)" />
      <circle
        cx="200"
        cy="168"
        r="26"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <text
        x="200"
        y="177"
        textAnchor="middle"
        fontFamily="var(--font-display), Georgia, serif"
        fontSize="24"
        fill="var(--seal-ink)"
      >
        E
      </text>
    </svg>
  );
}

export default function Home() {
  return (
    <>
      {/* Trust bar — one only, per the banner spec */}
      <div className="border-b border-line bg-surface">
        <p className="mx-auto max-w-5xl px-4 py-2 text-center text-sm text-muted">
          Sealed on paper · Encrypted until it is printed · Posted from Germany
        </p>
      </div>

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5">
        <span className="font-display text-xl tracking-tight">
          The Envelope
        </span>
        <nav aria-label="Primary">
          <a
            href="#how"
            className="text-sm text-muted underline-offset-4 hover:underline"
          >
            How it works
          </a>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero — one headline, one sub, ONE call to action.
            No competing buttons above the fold. */}
        <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-4 pb-16 pt-8 lg:grid-cols-2 lg:pt-14">
          <div>
            <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
              Write to your first anniversary.
              <span className="block text-seal">We post it on the day.</span>
            </h1>
            <p className="mt-5 max-w-prose text-lg text-muted">
              A letter you write today, sealed in paper and held until the date
              you pick — up to {HORIZON_MAX_YEARS} years out. It arrives in the
              post, not the inbox.
            </p>
            <Link
              href="/write"
              className="mt-8 inline-block rounded-sm bg-seal px-7 py-3.5 text-lg text-seal-ink transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seal"
            >
              Write your letter — €19
            </Link>
            <p className="mt-3 text-sm text-muted">
              One payment. No account needed. €29 for a couple&rsquo;s pair.
            </p>
          </div>
          <SealedEnvelope className="w-full max-w-md justify-self-center" />
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 pt-10 sm:grid-cols-3">
            {[
              [
                "4M+",
                "copies sold of printed “letters to open later” keepsake books",
              ],
              [
                "1M+",
                "people a month write letters to their future selves online",
              ],
              ["€21B", "spent on wedding and anniversary gifts each year"],
            ].map(([stat, label]) => (
              <div key={stat}>
                <p className="font-display text-3xl text-seal">{stat}</p>
                <p className="mt-1 text-sm text-muted">{label}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto max-w-5xl px-4 pb-8 pt-6 text-xs text-muted">
            These figures describe the wider keepsake and gifting market, not
            this product&rsquo;s own sales.
          </p>
        </section>

        <section id="how" className="mx-auto w-full max-w-5xl px-4 py-16">
          <h2 className="font-display text-3xl tracking-tight">How it works</h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            {[
              [
                "Write it",
                "Type your letter and choose who receives it. Take as long as you like.",
              ],
              [
                "Pick the date",
                `Any date from a month out to ${HORIZON_MAX_YEARS} years. Most people choose their first anniversary.`,
              ],
              [
                "We post it",
                "On the morning of that date we print, seal, and hand it to Deutsche Post.",
              ],
            ].map(([title, body], i) => (
              <li key={title}>
                <span
                  className="font-display text-sm text-gold"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-1 font-display text-xl">{title}</h3>
                <p className="mt-2 text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-t border-line bg-surface">
          <div className="mx-auto w-full max-w-5xl px-4 py-16">
            <h2 className="font-display text-3xl tracking-tight">
              What happens to your letter
            </h2>
            <dl className="mt-8 grid gap-8 sm:grid-cols-2">
              {[
                [
                  "It is encrypted while we hold it",
                  "Your words are encrypted at rest and decrypted once, on the day we print them.",
                ],
                [
                  `We cap the wait at ${HORIZON_MAX_YEARS} years`,
                  "A promise we can actually keep. Postage and businesses both change more than people expect over a decade.",
                ],
                [
                  "You can cancel a pending letter",
                  "Ask us to cancel and we delete the letter itself, not just the schedule.",
                ],
                [
                  "If we ever close, nothing is stranded",
                  "Undelivered letters are posted early or returned to you. That promise is published, not implied.",
                ],
              ].map(([term, desc]) => (
                <div key={term}>
                  <dt className="font-display text-lg">{term}</dt>
                  <dd className="mt-2 text-muted">{desc}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-4 py-20 text-center">
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            Someone opens this in a year.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            Write it while the day still feels like this.
          </p>
          <Link
            href="/write"
            className="mt-8 inline-block rounded-sm bg-seal px-7 py-3.5 text-lg text-seal-ink transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seal"
          >
            Write your letter — €19
          </Link>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-muted sm:flex-row sm:justify-between">
          <span>The Envelope</span>
          <nav aria-label="Footer" className="flex gap-5">
            <Link
              href="/promise"
              className="underline-offset-4 hover:underline"
            >
              Our wind-down promise
            </Link>
            <Link
              href="/privacy"
              className="underline-offset-4 hover:underline"
            >
              Privacy
            </Link>
            <Link href="/terms" className="underline-offset-4 hover:underline">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
