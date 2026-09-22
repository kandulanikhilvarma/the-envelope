import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import {
  Flourish,
  PostedEnvelopeArt,
  SealedEnvelopeArt,
} from "@/components/art.tsx";
import {
  ArrowRightIcon,
  CalendarIcon,
  CapIcon,
  CheckIcon,
  CompassIcon,
  HeartIcon,
  LockIcon,
  MailIcon,
  PenIcon,
  PlaneIcon,
  PrinterIcon,
  RingsIcon,
  ShieldIcon,
  SparkIcon,
  UndoIcon,
} from "@/components/icons.tsx";
import { BODY_MAX_CHARS, HORIZON_MAX_YEARS } from "@/lib/letters.ts";
import { OCCASIONS, type OccasionKey } from "@/lib/occasions.ts";
import { breakdown, formatEur } from "@/lib/pricing.ts";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;

const SINGLE = formatEur(breakdown("single").grossCents);
const PAIR = formatEur(breakdown("pair").grossCents);

const OCCASION_ICONS: Record<OccasionKey, IconType> = {
  wedding: RingsIcon,
  anniversary: HeartIcon,
  baby: SparkIcon,
  graduation: CapIcon,
  self: CompassIcon,
  farewell: PlaneIcon,
};

const STEPS: [IconType, string, string][] = [
  [
    PenIcon,
    "Write your letter",
    "Type it in your own words, add the address, and choose the date. No account is needed.",
  ],
  [
    LockIcon,
    "We seal and hold it",
    "Your letter is encrypted the moment you submit it and stays that way while we hold it.",
  ],
  [
    MailIcon,
    "We check in first",
    "About a week before the date, we email you the address we hold so you can correct it.",
  ],
  [
    PrinterIcon,
    "We post it on the day",
    "On the morning of your date it is printed, sealed in an envelope, and handed to Deutsche Post.",
  ],
];

const FAQ: [string, string][] = [
  [
    "Who can read my letter?",
    "Your letter is encrypted as soon as you submit it. It is decrypted once, by the automated print step on the delivery date. We do not read letters, and the text never appears in any email we send.",
  ],
  [
    "How far ahead can I send it?",
    `Any date from tomorrow up to ${HORIZON_MAX_YEARS} years from today. We cap the wait so that every promise we make is one we can keep.`,
  ],
  [
    "Is the letter handwritten?",
    "No. Your words are printed clearly on paper, folded, and posted in a sealed envelope. What arrives is exactly what you wrote.",
  ],
  [
    "Where can you send letters?",
    "Letters are printed in Germany and posted by Deutsche Post, including to international addresses. Enter the address as it should appear on the envelope.",
  ],
  [
    "What if the address changes?",
    "About a week before we post, we email you the address we hold. Reply to that email with the new address and we will correct it before printing.",
  ],
  [
    "Can I cancel?",
    "Yes, at any time before the letter is printed. Use the reference from your confirmation. We delete the letter itself and refund your payment.",
  ],
  [
    "What happens if The Envelope closes?",
    "Nothing is stranded. Every undelivered letter is either posted early or returned to its writer, and we tell you which before it happens.",
  ],
];

function JsonLd() {
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "The Envelope",
      description:
        "A letter written today, held encrypted, and posted on paper on a date you choose up to five years ahead.",
      offers: [
        {
          "@type": "Offer",
          name: "One sealed letter",
          price: (breakdown("single").grossCents / 100).toFixed(2),
          priceCurrency: "EUR",
        },
        {
          "@type": "Offer",
          name: "A couple's pair",
          price: (breakdown("pair").grossCents / 100).toFixed(2),
          priceCurrency: "EUR",
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ.map(([q, a]) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ];
  return (
    <script
      type="application/ld+json"
      // Static, server-built data with no user input in it.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

function SectionHeading({
  eyebrow,
  title,
  lead,
  center = false,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {lead ? (
        <p className="mt-4 text-lg leading-relaxed text-muted text-pretty">
          {lead}
        </p>
      ) : null}
    </div>
  );
}

export default function Home() {
  return (
    <main className="flex-1">
      <JsonLd />

      {/* Hero: one headline, one supporting line, one primary action. */}
      <section className="paper-grain overflow-hidden">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pb-28 lg:pt-20">
          <div className="animate-rise">
            <p className="eyebrow">Keepsake letters, posted on the day</p>
            <h1 className="mt-4 font-display text-[2.6rem] leading-[1.05] tracking-tight text-balance sm:text-6xl">
              Write to your first anniversary.
              <span className="mt-1 block italic text-seal">
                We post it on the day.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted text-pretty sm:text-xl">
              Write a letter today. We seal it, keep it encrypted, and post it
              on paper on the date you choose, up to {HORIZON_MAX_YEARS} years
              from now. It arrives in the letterbox, not the inbox.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/write" className="btn btn-primary px-7 py-3.5">
                Write your letter
                <ArrowRightIcon className="size-5" />
              </Link>
              <Link href="#how" className="btn btn-secondary px-6 py-3.5">
                How it works
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">
              One payment of {SINGLE}, or {PAIR} for a couple’s pair. No
              account, no subscription.
            </p>

            <ul className="mt-10 grid gap-4 border-t border-line pt-8 text-sm sm:grid-cols-3">
              {(
                [
                  [LockIcon, "Encrypted until printed"],
                  [PrinterIcon, "Printed and posted in Germany"],
                  [UndoIcon, "Cancel for a full refund"],
                ] as [IconType, string][]
              ).map(([Icon, label]) => (
                <li key={label} className="flex items-center gap-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-seal-soft text-seal">
                    <Icon className="size-[1.1rem]" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div
              aria-hidden="true"
              className="absolute inset-8 -z-10 rounded-full bg-seal/10 blur-3xl"
            />
            <SealedEnvelopeArt className="w-full" />
          </div>
        </div>
      </section>

      {/* Market context, labelled honestly as not ours. */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
          <dl className="grid gap-8 sm:grid-cols-3">
            {[
              [
                "4M+",
                "copies sold of printed “letters to open later” keepsake books",
              ],
              [
                "1M+",
                "people a month write to their future selves online",
              ],
              ["€21B", "spent on wedding and anniversary gifts each year"],
            ].map(([stat, label]) => (
              <div key={stat} className="border-l-2 border-gold/60 pl-5">
                <dt className="font-display text-4xl text-seal">{stat}</dt>
                <dd className="mt-1 text-sm text-muted">{label}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-xs text-muted">
            These figures describe the wider keepsake and gifting market, not
            this service’s own sales.
          </p>
        </div>
      </section>

      <section id="how" className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
        <SectionHeading
          eyebrow="How it works"
          title="Four steps between today and the day it arrives."
          lead="You write once. Everything after that is our job, and we tell you before anything irreversible happens."
        />
        <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
          {STEPS.map(([Icon, title, body], i) => (
            <li key={title} className="relative">
              {i < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="absolute left-14 right-0 top-6 hidden border-t border-dashed border-line-strong md:block"
                />
              ) : null}
              <span className="relative grid size-12 place-items-center rounded-full border border-line bg-paper text-seal shadow-card">
                <Icon className="size-5" />
              </span>
              <p className="mt-5 font-display text-sm text-gold-text">
                Step {i + 1}
              </p>
              <h3 className="mt-1 font-display text-xl">{title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        id="occasions"
        className="paper-grain border-y border-line bg-surface"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
          <SectionHeading
            eyebrow="Occasions"
            title="Made for the dates that matter."
            lead={`Each occasion opens the writing page with prompts to help you begin. Every letter can go to any date within ${HORIZON_MAX_YEARS} years.`}
          />
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {OCCASIONS.map((o) => {
              const Icon = OCCASION_ICONS[o.key];
              return (
                <li key={o.key}>
                  <Link
                    href={`/write?occasion=${o.key}`}
                    className="card group flex h-full flex-col p-6 transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <span className="grid size-11 place-items-center rounded-lg bg-seal-soft text-seal">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-5 font-display text-xl">{o.title}</h3>
                    <p className="mt-2 flex-1 leading-relaxed text-muted">
                      {o.summary}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm text-seal">
                      Start this letter
                      <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* What arrives: an example letter next to the envelope it comes in. */}
      <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              eyebrow="What arrives"
              title="Your words, on paper, on the day."
              lead={`Up to ${BODY_MAX_CHARS.toLocaleString("en")} characters, printed clearly and posted in a sealed envelope. It is the same letter you wrote, delivered a year or five later.`}
            />
            <PostedEnvelopeArt className="mt-10 w-full max-w-md" />
          </div>

          <figure>
            <div className="card relative px-7 py-10 sm:rotate-1 sm:px-12 sm:py-14">
              <span className="absolute right-5 top-5 rounded-full border border-line px-3 py-1 text-xs text-muted">
                Example
              </span>
              <div className="space-y-4 font-body text-[1.05rem] leading-relaxed">
                <p className="text-sm text-muted">12 June 2026</p>
                <p>Dear Jonas,</p>
                <p>
                  It is nearly midnight and your tie is somewhere under the
                  table. I wanted to write this before the day turns into a
                  story we tell.
                </p>
                <p>
                  When you read this we will have been married for a year. I
                  hope we still laugh about the speeches. I hope we kept the
                  Sunday walks. The moment I remember most is not the vows. It
                  is you, just before them, straightening my collar with both
                  hands.
                </p>
                <p>Open the good wine. I will be in the kitchen.</p>
                <p className="font-display text-lg italic">
                  With all my love,
                  <br />
                  Mira
                </p>
              </div>
            </div>
            <figcaption className="mt-5 text-center text-sm text-muted">
              An illustrative letter. Yours stays private and encrypted.
            </figcaption>
          </figure>
        </div>
      </section>

      <section id="pricing" className="border-y border-line bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
          <SectionHeading
            center
            eyebrow="Pricing"
            title="One payment. Nothing to renew."
            lead="Printing, postage, encrypted storage and the address check are all included."
          />
          <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
            {[
              {
                name: "One sealed letter",
                price: SINGLE,
                note: "For one recipient",
                features: [
                  `Up to ${BODY_MAX_CHARS.toLocaleString("en")} characters`,
                  `Any date up to ${HORIZON_MAX_YEARS} years ahead`,
                  "Encrypted until it is printed",
                  "Address check one week before posting",
                  "Cancel before printing for a full refund",
                ],
                featured: false,
              },
              {
                name: "A couple’s pair",
                price: PAIR,
                note: "Two letters, one date",
                features: [
                  "Two letters, sealed separately",
                  "Posted together on the same date",
                  "Same address or two different ones",
                  "Everything included with a single letter",
                ],
                featured: true,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`card relative flex flex-col p-8 ${
                  plan.featured ? "border-seal/40 ring-1 ring-seal/20" : ""
                }`}
              >
                {plan.featured ? (
                  <span className="absolute -top-3 left-8 rounded-full bg-seal px-3 py-1 text-xs tracking-wide text-seal-ink">
                    For couples
                  </span>
                ) : null}
                <h3 className="font-display text-2xl">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted">{plan.note}</p>
                <p className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-5xl tracking-tight">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted">one payment</span>
                </p>
                <ul className="mt-7 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-3">
                      <CheckIcon className="mt-0.5 size-5 shrink-0 text-sage" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.featured ? "/write?sku=pair" : "/write"}
                  className={`btn mt-8 w-full ${plan.featured ? "btn-primary" : "btn-secondary"}`}
                >
                  {plan.featured ? "Write your pair" : "Write your letter"}
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted">
            Prices include 19% German VAT. Secure card payment through Stripe.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6">
        <SectionHeading
          eyebrow="Our commitments"
          title="What happens to your letter while we hold it."
        />
        <dl className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {(
            [
              [
                LockIcon,
                "It is encrypted while we hold it",
                "Your words are encrypted at rest and decrypted once, on the day they are printed.",
              ],
              [
                CalendarIcon,
                `We cap the wait at ${HORIZON_MAX_YEARS} years`,
                "A promise we can keep. Postage prices and businesses both change more over a decade than most people expect.",
              ],
              [
                UndoIcon,
                "You can cancel a pending letter",
                "Cancelling deletes the letter itself, not only its place in the queue, and refunds your payment.",
              ],
              [
                ShieldIcon,
                "If we ever close, nothing is stranded",
                "Undelivered letters are posted early or returned to you. That commitment is published, not implied.",
              ],
            ] as [IconType, string, string][]
          ).map(([Icon, term, desc]) => (
            <div key={term} className="flex gap-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-sage-soft text-sage">
                <Icon className="size-5" />
              </span>
              <div>
                <dt className="font-display text-xl">{term}</dt>
                <dd className="mt-2 leading-relaxed text-muted">{desc}</dd>
              </div>
            </div>
          ))}
        </dl>
        <p className="mt-10">
          <Link href="/promise" className="link">
            Read our full wind-down promise
          </Link>
        </p>
      </section>

      <section id="faq" className="border-t border-line bg-surface">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1fr_1.6fr]">
          <SectionHeading
            eyebrow="Questions"
            title="Before you seal it."
            lead="The answers people most often look for. For anything else, the contact details are in the Impressum."
          />
          <div className="divide-y divide-line border-y border-line">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-lg [&::-webkit-details-marker]:hidden">
                  {q}
                  <span
                    aria-hidden="true"
                    className="grid size-7 shrink-0 place-items-center rounded-full border border-line-strong text-seal transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-prose leading-relaxed text-muted">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink text-bg">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6">
          <Flourish className="w-28" />
          <h2 className="mt-6 font-display text-4xl tracking-tight text-balance sm:text-5xl">
            Someone opens this in a year.
          </h2>
          <p className="mt-5 max-w-xl text-lg opacity-80">
            Write it while the day still feels like this.
          </p>
          <Link href="/write" className="btn btn-inverse mt-10 px-8 py-4">
            Write your letter, {SINGLE}
            <ArrowRightIcon className="size-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
