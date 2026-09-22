-- Rate limiting for the two unauthenticated write paths.
--
-- /write creates database rows and a Stripe Checkout Session on every
-- submission, and /cancel accepts a token from anyone. Neither has a login in
-- front of it, so without a limit a script can fill the letters table and run
-- up Stripe API calls at no cost to itself.
--
-- The counter lives in Postgres rather than in memory because the app runs on
-- serverless instances: process memory is per-instance, resets constantly,
-- and is therefore not a limit at all.
--
-- The bucket key holds a hash of the caller's IP, never the address itself.
-- Rows are transient and the dispatch worker sweeps old ones daily.

create table public.rate_limit (
  bucket        text primary key,
  window_start  timestamptz not null default now(),
  count         integer not null default 0
);

alter table public.rate_limit enable row level security;

comment on table public.rate_limit is
  'Transient counters. bucket is "<action>:<sha256 of ip>" — never a raw address.';

-- ── consume_rate_limit ───────────────────────────────────────────────
-- Counts one hit and answers whether it is still within the allowance.
--
-- A single INSERT … ON CONFLICT DO UPDATE, so the read-modify-write cannot
-- interleave: two concurrent requests from one caller both count. Doing this
-- as SELECT-then-UPDATE would let a burst slip through the gap.
create or replace function public.consume_rate_limit(
  p_bucket         text,
  p_limit          integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.rate_limit as r (bucket, window_start, count)
  values (p_bucket, now(), 1)
  on conflict (bucket) do update
     set count = case
           when r.window_start < now() - make_interval(secs => p_window_seconds)
             then 1
           else r.count + 1
         end,
         window_start = case
           when r.window_start < now() - make_interval(secs => p_window_seconds)
             then now()
           else r.window_start
         end
  returning r.count into v_count;

  return v_count <= p_limit;
end;
$$;

-- ── sweep_rate_limits ────────────────────────────────────────────────
-- Called by the daily worker. Without it the table grows forever with rows
-- nothing will ever read again.
create or replace function public.sweep_rate_limits()
returns integer
language sql
security definer
set search_path = public
as $$
  with gone as (
    delete from public.rate_limit
     where window_start < now() - interval '1 day'
    returning 1
  )
  select count(*)::integer from gone;
$$;

-- ── Lock down, as 0002 and 0004 do ───────────────────────────────────
-- A limiter callable by the public is a limiter anyone can exhaust on
-- someone else's behalf.
revoke execute on function public.consume_rate_limit(text, integer, integer)
  from public, anon, authenticated;
revoke execute on function public.sweep_rate_limits()
  from public, anon, authenticated;

grant execute on function public.consume_rate_limit(text, integer, integer)
  to service_role;
grant execute on function public.sweep_rate_limits() to service_role;
