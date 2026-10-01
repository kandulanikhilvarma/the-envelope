# The Envelope

The Envelope lets a customer write a private letter today, seal it encrypted,
and have it printed and posted from Germany on a chosen future date. The
audience includes couples marking weddings or anniversaries and people writing
to their future selves. The important scene is a customer returning months or
years later, after moving house, to make sure their keepsake reaches them.

The product is a Next.js web app. A single letter costs €19; a pair costs €29,
including 19% German VAT. The default wait is one year and the maximum is five.
Stripe handles checkout, Supabase stores encrypted content, Pingen prints and
posts, and Resend sends confirmations and a notice about a week before posting.

There are no customer accounts. The private reference in the confirmation is
a bearer credential. It must stay out of URLs, logs and persistent browser
storage. Cancellation deletes the encrypted letter and triggers a refund before
printing. A management flow may show delivery metadata and correct the postal
address, but must never retrieve or reveal the letter body.

Preserve the established ivory stationery, oxblood actions, sage confirmations,
Fraunces headings, Source Serif 4 text, accessible controls and automatic dark
theme. Extend the current experience; retain the existing checkout and dispatch
contracts. No invented operational, legal or delivery claims.

Success for the management enhancement: customers can check the actual status
and correct either letter's address themselves before printing, using the
existing reference. Updates must be authorized per request and must lose safely
if dispatch has already claimed a letter. No new provider or database migration
is needed. The user has authorized autonomous decisions and implementation.
