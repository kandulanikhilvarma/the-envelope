# The Envelope

Write a letter today. We seal it, hold it encrypted, and post it on paper on a
date you choose — up to five years out.

Wedding and anniversary keepsake wedge. One-time purchase: **€19** for a single
letter, **€29** for a couple's pair. Operated from Germany, printed and posted
via Pingen on Deutsche Post rails.

## Stack

Next.js 16 (App Router, RSC) · TypeScript · Tailwind v4 · Supabase Postgres ·
Stripe Checkout · Pingen · deployed on Vercel.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

| Script | Does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm run typecheck` | `next typegen` then `tsc --noEmit` |
| `npm run lint` | ESLint |

`next typegen` must run before `tsc` — Next generates the route types that
`layout.tsx` and `page.tsx` depend on.

## Architecture

Diagrams in [`docs/architecture/`](docs/architecture/) (Mermaid, all validated):

- `01-system-context.mmd` — how the pieces fit
- `02-checkout-sequence.mmd` — the money path
- `03-trigger-sequence.mmd` — the date trigger and mail path

## Scope guardrails

These are load-bearing, not preferences. Each came out of a risk assessment,
and removing one re-introduces a risk that was deliberately engineered out.

- **One trigger type: a future date.** No dead-man's-switch, no inactivity triggers.
- **No third-party letters.** Self-directed only. Mailing disclosures *about*
  someone to a third party invites defamation and GDPR exposure, and reads as
  coercion to a payment processor.
- **Horizon capped at 5 years** (12 months default), enforced in both app
  validation and a database `CHECK`.
- **Pay-at-send fulfilment.** Postage is only spent when the trigger fires, so
  the stored liability is a promise, not money already gone.
- **Published wind-down promise.** If the service closes, undelivered letters
  are posted early or returned.

## Open decision

Whether the sale is classified as goods or as a service is still open, and it
determines the VAT treatment and the exact consent wording.

The code takes the conservative path either way: a pending letter can always
be cancelled, which deletes it and refunds the payment. That satisfies a
withdrawal right if one applies, and costs nothing if one does not — so the
classification no longer blocks the schema. Working notes are kept outside
this repository.

## Security

Never commit real credentials. See [SECURITY.md](SECURITY.md) — including the
encryption keyring rules, which are the single most destructive thing to get
wrong in this codebase.
