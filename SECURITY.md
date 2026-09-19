# Security & data handling

## Reporting

Email the operator directly. Do not open a public issue for a vulnerability.

## The encryption keyring — read this before touching `lib/crypto`

Letter bodies are encrypted at rest with AES-256-GCM. A letter written today
may not be decrypted until five years from now.

That single fact drives every rule here:

- Keys live in `LETTER_ENCRYPTION_KEYRING` as a **versioned map**, never a bare
  key. Every letter row stores the `key_version` it was encrypted under.
- **Rotation is additive.** Add a new version, bump
  `LETTER_ENCRYPTION_ACTIVE_VERSION`, and keep every prior version forever.
- **Deleting a key version permanently destroys every letter encrypted under
  it.** There is no recovery. This is the worst available outcome: silent, total
  data loss that only surfaces years later, on the day a customer expected post.
- Keep an **offline escrow copy** of the keyring, outside the hosting provider.
- Decryption happens once, server-side, in the dispatch worker. Plaintext is
  never logged, never returned to a client, never written to disk.

## Special-category data

People write about health, relationships, religion and grief. Assume every
letter contains GDPR Article 9 special-category data:

- Explicit consent is captured at checkout and recorded in `consent_log`.
- Letter bodies never appear in logs, error reports, or analytics payloads.
- Cancelling a letter **hard-deletes the ciphertext**, not just the schedule.

## Secrets

- Real values live in Vercel and Supabase environment settings only.
- `.env.example` holds placeholders and is the only env file committed.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — server contexts only.
- The dispatch route is guarded by `CRON_SECRET`; without it the endpoint is
  world-invokable by anyone who guesses the path.

## Wind-down promise

If the service stops operating, undelivered letters are posted early or
returned to the sender, and stored letter data is destroyed on a published
timetable. This is a commitment to customers, not an internal aspiration —
changing it is a customer-facing change.
