-- The Envelope, initial schema.
--
-- Design notes that are load-bearing:
--   * A letter is written before it is paid for, so it starts at
--     'pending_payment' and only the Stripe webhook promotes it to
--     'scheduled'. Nothing unpaid is ever eligible for dispatch.
--   * letters.status carries a 'sending' state so the dispatch worker can
--     claim a row by compare-and-swap. Without it two overlapping cron runs
--     can both mail the same letter.
--   * key_version is stored per letter. Letters may not be decrypted for up
--     to five years, so the encryption key is a versioned keyring, never a
--     single value. Dropping a version destroys every letter under it.
--   * created_on is a date (not derived from created_at) so the five-year
--     CHECK is immutable. timestamptz -> date is only STABLE, and Postgres
--     rejects non-immutable expressions in CHECK constraints.

create extension if not exists pgcrypto;

-- ── orders ───────────────────────────────────────────────────────────
create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  stripe_session_id   text not null unique,
  sku                 text not null check (sku in ('single', 'pair')),
  amount_cents        integer not null check (amount_cents > 0),
  vat_cents           integer not null check (vat_cents >= 0),
  currency            text not null default 'EUR',
  purchaser_email     text,
  status              text not null default 'pending'
                        check (status in ('pending', 'paid', 'refunded')),
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);

comment on column public.orders.stripe_session_id is
  'Unique. This is what makes webhook replay idempotent.';

-- ── letters ──────────────────────────────────────────────────────────
create table public.letters (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders(id) on delete restrict,

  -- Ciphertext, never plaintext. Nulled out on withdrawal/erasure.
  content_ciphertext  bytea,
  content_iv          bytea,
  key_version         text,

  recipient           jsonb not null,

  created_on          date not null default current_date,
  deliver_on          date not null,

  -- Starts at 'pending_payment': the letter body is far larger than Stripe
  -- metadata allows, so it is persisted before the redirect and activated
  -- by the webhook. An abandoned checkout simply never leaves this state,
  -- and is never eligible for dispatch.
  status              text not null default 'pending_payment'
                        check (status in ('pending_payment', 'scheduled',
                                          'sending', 'sent', 'retry',
                                          'failed', 'withdrawn')),
  attempts            integer not null default 0,
  last_error          text,

  pingen_id           text,
  sent_at             timestamptz,
  created_at          timestamptz not null default now(),

  -- The horizon cap, enforced independently of application validation.
  constraint letters_horizon_max_5y
    check (deliver_on <= created_on + interval '5 years'),
  constraint letters_deliver_in_future
    check (deliver_on > created_on),

  -- A letter that still has content must record which key opens it.
  constraint letters_key_version_present
    check (content_ciphertext is null or key_version is not null)
);

create index letters_due_idx
  on public.letters (deliver_on)
  where status in ('scheduled', 'retry');

-- ── consent_log ──────────────────────────────────────────────────────
-- The burden of proving consent sits with the operator, so this is an
-- append-only evidence table, not a flag on the order.
create table public.consent_log (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders(id) on delete restrict,
  art9_ack            boolean not null,
  withdrawal_ack      boolean not null,
  text_version        text not null,
  ip                  inet,
  user_agent          text,
  created_at          timestamptz not null default now()
);

-- ── cron_heartbeat ───────────────────────────────────────────────────
-- Single row. Lets an external watchdog notice the scheduler has stopped,
-- which is otherwise silent until someone's letter arrives late.
create table public.cron_heartbeat (
  id                  boolean primary key default true check (id),
  last_run_at         timestamptz not null default now(),
  last_sent_count     integer not null default 0
);

insert into public.cron_heartbeat (id) values (true);

-- ── Row level security ───────────────────────────────────────────────
-- No end-user accounts in v1: every write happens server-side through the
-- service role, which bypasses RLS. Enabling RLS with no permissive policy
-- means a leaked anon key still reads nothing.
alter table public.orders         enable row level security;
alter table public.letters        enable row level security;
alter table public.consent_log    enable row level security;
alter table public.cron_heartbeat enable row level security;

-- ── claim_due_letters ────────────────────────────────────────────────
-- Atomically claims due letters for one worker run.
--
-- SKIP LOCKED plus the status predicate inside the UPDATE means two
-- concurrent runs can never claim the same row: the loser's WHERE no
-- longer matches once the winner commits 'sending'.
--
-- deliver_on <= current_date (not =) so a missed run catches up instead
-- of silently skipping a day's letters forever.
create or replace function public.claim_due_letters(batch_size integer default 50)
returns setof public.letters
language sql
security definer
set search_path = public
as $$
  update public.letters
     set status   = 'sending',
         attempts = attempts + 1
   where id in (
     select id
       from public.letters
      where deliver_on <= current_date
        and status in ('scheduled', 'retry')
      order by deliver_on
      for update skip locked
      limit batch_size
   )
  returning *;
$$;

-- ── overdue_letter_count ─────────────────────────────────────────────
-- Anything still unsent a day past its date means the scheduler is broken
-- or Pingen is rejecting sends. Either way a human needs to know.
create or replace function public.overdue_letter_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
    from public.letters
   where deliver_on < current_date - 1
     and status in ('scheduled', 'retry', 'sending');
$$;
