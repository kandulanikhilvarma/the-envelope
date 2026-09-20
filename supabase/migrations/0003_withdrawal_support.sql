-- Support withdrawing a letter before it is posted.
--
-- docs/legal/classification.md records this as the conservative reading: if
-- the sale is a service, the 14-day withdrawal right survives, because a
-- letter delivered next year is not "fully performed" inside the window.
-- Building it is cheap — fulfilment is pay-at-send, so nothing has been
-- spent — and it is the fallback position if the personalised-goods
-- argument is ever challenged.
--
-- Two columns are needed:
--
--   stripe_payment_intent_id — you cannot refund a Checkout Session, only
--   the payment intent behind it. Captured by the webhook.
--
--   cancel_token — there are no user accounts, so possession of an
--   unguessable token is what authorises a cancel. 122 bits of randomness,
--   shown once on the confirmation page. Not the order id, which should
--   never double as a credential.

alter table public.orders
  add column stripe_payment_intent_id text,
  add column cancel_token uuid not null default gen_random_uuid();

create unique index orders_cancel_token_idx on public.orders (cancel_token);

comment on column public.orders.cancel_token is
  'Bearer credential for cancelling. Never log it, and never put it in a URL that gets recorded server-side.';
