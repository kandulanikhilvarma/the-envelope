import Link from "next/link";
import { WaxSeal } from "./art.tsx";

export function Logo() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2.5 rounded-sm"
      aria-label="The Envelope, home"
    >
      <svg
        viewBox="-20 -20 40 40"
        className="size-8 transition-transform duration-300 group-hover:-rotate-12"
        aria-hidden="true"
      >
        <WaxSeal r={15} />
      </svg>
      <span className="font-display text-xl tracking-tight">The Envelope</span>
    </Link>
  );
}

const NAV = [
  ["/#how", "How it works"],
  ["/#occasions", "Occasions"],
  ["/#pricing", "Pricing"],
  ["/#faq", "Questions"],
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-3.5 sm:px-6">
        <Logo />
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-7 text-[0.9375rem] text-muted">
            {NAV.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="transition-colors hover:text-ink">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link
          href="/write"
          className="btn btn-primary px-4 py-2 text-[0.9375rem]"
        >
          Write a letter
        </Link>
      </div>
    </header>
  );
}

const FOOTER = [
  {
    title: "The service",
    links: [
      ["/write", "Write a letter"],
      ["/#how", "How it works"],
      ["/#pricing", "Pricing"],
      ["/#faq", "Questions"],
    ],
  },
  {
    title: "Your letter",
    links: [
      ["/cancel", "Cancel a letter"],
      ["/promise", "Wind-down promise"],
    ],
  },
  {
    title: "Legal",
    links: [
      ["/privacy", "Privacy"],
      ["/terms", "Terms"],
      // Reachable from every page: German law requires the Impressum to be.
      ["/imprint", "Impressum"],
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
            Letters written today, held encrypted, and posted on paper on the
            date you choose. Printed in Germany and delivered by Deutsche
            Post.
          </p>
        </div>
        {FOOTER.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="eyebrow">{group.title}</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              {group.links.map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-muted transition-colors hover:text-ink"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto w-full max-w-6xl px-4 py-5 text-xs text-muted sm:px-6">
          © {new Date().getFullYear()} The Envelope. All prices include 19%
          German VAT. Payments are processed by Stripe.
        </p>
      </div>
    </footer>
  );
}
