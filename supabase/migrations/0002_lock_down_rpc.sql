-- Take the dispatch RPCs off the public API.
--
-- Postgres grants EXECUTE on new functions to PUBLIC by default, and
-- Supabase exposes everything in the `public` schema through PostgREST. That
-- combination made both functions callable by anyone holding the anon key,
-- at /rest/v1/rpc/claim_due_letters.
--
-- Both are SECURITY DEFINER, so RLS does not apply. claim_due_letters is
-- `returns setof letters`, which means an unauthenticated caller got back
-- recipient names, postal addresses and delivery dates — and, because the
-- call also flips rows to 'sending', every letter it touched would be
-- stranded there and never posted.
--
-- CRON_SECRET guards the route handler. It does not guard the database, and
-- PostgREST reaches the function without going near the route.
--
-- Only the service role should ever call these. Found by the Supabase
-- security advisor after the first migration was applied.

revoke execute on function public.claim_due_letters(integer)
  from public, anon, authenticated;

revoke execute on function public.overdue_letter_count()
  from public, anon, authenticated;

grant execute on function public.claim_due_letters(integer) to service_role;
grant execute on function public.overdue_letter_count() to service_role;
