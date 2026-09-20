"use client";

import { useActionState, useId, useState } from "react";
import type { ComposeState } from "@/lib/consent.ts";
import { composeLetter } from "./actions.ts";

/**
 * The only interactive surface in the product. Being a Client Component here
 * buys the character counter and the pending state; everything it accepts is
 * re-validated in the action, because nothing typed in a browser is trusted.
 */

const FIELD =
  "mt-1 w-full rounded-sm border border-line bg-bg px-3 py-2 text-ink " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seal";

const LABEL = "block text-sm text-muted";

export function ComposeForm({
  defaultDate,
  maxDate,
  bodyMaxChars,
  singlePrice,
  pairPrice,
}: {
  defaultDate: string;
  maxDate: string;
  bodyMaxChars: number;
  singlePrice: string;
  pairPrice: string;
}) {
  const [state, formAction, pending] = useActionState<ComposeState, FormData>(
    composeLetter,
    {},
  );
  const [used, setUsed] = useState(0);
  const bodyId = useId();
  const errorId = useId();

  return (
    <form action={formAction} className="mt-10 space-y-10">
      <section>
        <label htmlFor={bodyId} className="font-display text-xl">
          Your letter
        </label>
        <textarea
          id={bodyId}
          name="body"
          rows={14}
          required
          maxLength={bodyMaxChars}
          onChange={(event) => setUsed(event.target.value.length)}
          placeholder="Write it the way you would say it."
          className={`${FIELD} resize-y font-body leading-relaxed`}
        />
        <p className="mt-1 text-sm text-muted">
          {used.toLocaleString("en")} of {bodyMaxChars.toLocaleString("en")}{" "}
          characters
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl">When should it arrive?</h2>
        <label htmlFor="deliverOn" className={`${LABEL} mt-4`}>
          Delivery date
        </label>
        {/* Native date input: no picker dependency, and it gets the mobile
            keyboard right for free. Bounds are server-computed. */}
        <input
          type="date"
          id="deliverOn"
          name="deliverOn"
          required
          defaultValue={defaultDate}
          max={maxDate}
          className={`${FIELD} max-w-xs`}
        />
        <p className="mt-1 text-sm text-muted">
          Anything up to {maxDate}. Most people choose their first anniversary.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl">Where do we post it?</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="name" className={LABEL}>
              Name
            </label>
            <input id="name" name="name" required className={FIELD} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="line1" className={LABEL}>
              Street and number
            </label>
            <input id="line1" name="line1" required className={FIELD} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="line2" className={LABEL}>
              Flat, floor, care of <span>(optional)</span>
            </label>
            <input id="line2" name="line2" className={FIELD} />
          </div>
          <div>
            <label htmlFor="postcode" className={LABEL}>
              Postcode
            </label>
            <input id="postcode" name="postcode" required className={FIELD} />
          </div>
          <div>
            <label htmlFor="city" className={LABEL}>
              City
            </label>
            <input id="city" name="city" required className={FIELD} />
          </div>
          <div>
            <label htmlFor="country" className={LABEL}>
              Country code
            </label>
            <input
              id="country"
              name="country"
              required
              defaultValue="DE"
              maxLength={2}
              className={`${FIELD} uppercase`}
            />
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">
          We email you before we post, so you can correct the address if it has
          changed by then.
        </p>
      </section>

      <section>
        <h2 className="font-display text-xl">What you are buying</h2>
        <div className="mt-4 space-y-2">
          <label className="flex gap-3 rounded-sm border border-line p-4">
            <input type="radio" name="sku" value="single" defaultChecked />
            <span>
              <span className="block">One sealed letter</span>
              <span className="text-sm text-muted">
                {singlePrice}, one payment
              </span>
            </span>
          </label>
          <label className="flex gap-3 rounded-sm border border-line p-4">
            <input type="radio" name="sku" value="pair" />
            <span>
              <span className="block">A couple&rsquo;s pair</span>
              <span className="text-sm text-muted">
                {pairPrice}, two letters to the same date
              </span>
            </span>
          </label>
        </div>
      </section>

      {/* Neither box is pre-ticked, and both are required. What was agreed
          is stored verbatim against the order. */}
      <section className="space-y-3 border-t border-line pt-8">
        <label className="flex gap-3 text-sm">
          <input type="checkbox" name="art9" required className="mt-1" />
          <span>
            I understand my letter is stored encrypted until its delivery date,
            and I consent to it being held even if it contains personal details
            about health, beliefs, or relationships.
          </span>
        </label>
        <label className="flex gap-3 text-sm">
          <input type="checkbox" name="withdrawal" required className="mt-1" />
          <span>
            I understand I can cancel a pending letter at any time before it is
            posted, and that cancelling deletes the letter itself.
          </span>
        </label>
      </section>

      {state.error ? (
        <p id={errorId} role="alert" className="text-seal">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        aria-describedby={state.error ? errorId : undefined}
        className="rounded-sm bg-seal px-7 py-3.5 text-lg text-seal-ink transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seal"
      >
        {pending ? "Taking you to payment…" : "Seal it and pay"}
      </button>
    </form>
  );
}
