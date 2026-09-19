# Contributing

## Branches and commits

- `main` is protected. Branch, then open a PR — no direct pushes.
- Short-lived feature branches, squash-merged.
- [Conventional Commits](https://www.conventionalcommits.org/). Subject ≤ 60
  characters, imperative mood, and it should say *why*, not restate the diff.

```
fix: guard dispatch against double-mailing on overlapping runs
```

## Before opening a PR

```bash
npm run lint && npm run typecheck && npm run build
```

CI runs the same three. Red blocks merge.

## Code conventions

- **Server Components by default.** Reach for `"use client"` only where there
  is real interactivity.
- **Validate at trust boundaries** with zod: form input, webhook bodies, and
  third-party API responses. Never trust a shape you did not construct.
- **Colours come from tokens.** Use `bg-seal` / `text-muted`, never a hex
  literal in a component. `--gold` fails AA as text — decorative use only.
- **Prefer the platform.** A native `<input type="date">` beats a date-picker
  dependency. Check what already exists before adding a package.
- **No swallowed errors.** A bare catch that logs and continues on the payment
  or mail path is a defect.

## Tests

Test the things that lose money or data, not everything:

- encrypt → decrypt round-trip, across key versions
- the 5-year horizon validator
- VAT and price arithmetic
- webhook idempotency on replayed Stripe events
- dispatch due-selection, including that a second run mails nothing twice

No test frameworks beyond what is already installed. A trivial one-liner does
not need a test.

## Things that are not up for refactor

The scope guardrails in the README are outcomes of a risk assessment. If you
think one should change, raise it as an issue first — do not quietly widen
scope in a PR.
