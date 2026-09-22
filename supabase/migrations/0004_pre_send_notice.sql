-- The pre-send notice.
--
-- Three places in the UI promise an email before a letter is posted, so the
-- address can be corrected if it has changed. This adds the state that makes
-- that promise keepable, and the claim function that sends it exactly once.
--
-- notified_at doubles as the claim marker: it is set inside the same UPDATE
-- that selects the row, so two overlapping runs cannot both email the same
-- person. If the send then fails the worker resets it to null and the next
-- day tries again — a notice that arrives a day late beats one sent twice.

alter table public.letters
  add column notified_at timestamptz;

comment on column public.letters.notified_at is
  'When the pre-send notice went out. Null means it has not been sent; the worker claims by setting it.';

create index letters_notify_idx
  on public.letters (deliver_on)
  where status = 'scheduled' and notified_at is null;

-- ── claim_letters_to_notify ──────────────────────────────────────────
-- Returns everything one notice needs, so the worker does not have to make
-- a second round trip per letter for the purchaser's address.
--
-- Only 'scheduled' letters qualify: an unpaid letter has no purchaser to
-- write to, and a withdrawn one no longer exists.
create or replace function public.claim_letters_to_notify(
  lead_days integer default 7,
  batch_size integer default 100
)
returns table (
  letter_id       uuid,
  deliver_on      date,
  recipient       jsonb,
  purchaser_email text,
  cancel_token    uuid
)
language sql
security definer
set search_path = public
as $$
  with claimed as (
    update public.letters
       set notified_at = now()
     where id in (
       select id
         from public.letters
        where status = 'scheduled'
          and notified_at is null
          and deliver_on <= current_date + lead_days
        order by deliver_on
        for update skip locked
        limit batch_size
     )
    returning id, order_id, letters.deliver_on, letters.recipient
  )
  select c.id, c.deliver_on, c.recipient, o.purchaser_email, o.cancel_token
    from claimed c
    join public.orders o on o.id = c.order_id;
$$;

-- ── Lock down, exactly as 0002 does ──────────────────────────────────
-- This one returns recipient addresses AND cancel tokens. A cancel token is
-- a bearer credential: whoever holds it can delete and refund someone
-- else's letter. It must never be reachable with the anon key.
revoke execute on function public.claim_letters_to_notify(integer, integer)
  from public, anon, authenticated;
grant  execute on function public.claim_letters_to_notify(integer, integer)
  to service_role;
