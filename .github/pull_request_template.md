## What

<!-- One or two lines. -->

## Why

<!-- The reason, not a restatement of the diff. -->

## Evidence

<!-- Screenshots for UI. Paste the test/command output for logic. -->

## Checklist

- [ ] `npm run lint && npm run typecheck && npm run build` pass locally
- [ ] No hex colours in components, tokens only
- [ ] No secrets, keys, or real customer data in the diff
- [ ] If this touches the money or mail path: idempotency still holds on replay
- [ ] If this touches `lib/crypto`: no key version was removed
- [ ] Scope guardrails in the README are intact (horizon cap, date-only
      trigger, no third-party letters)
