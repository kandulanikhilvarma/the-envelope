"use client";

import {
  type ReactNode,
  useActionState,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  AlertIcon,
  CalendarIcon,
  LockIcon,
  SparkIcon,
} from "@/components/icons.tsx";
import type { ComposeState } from "@/lib/consent.ts";
import { DRAFT_KEY } from "@/lib/draft.ts";
import { addMonths } from "@/lib/letters.ts";
import { composeLetter } from "./actions.ts";

/**
 * The only interactive surface in the product. Being a Client Component here
 * buys the live preview, the date presets, the draft kept for this tab and
 * the pending state; everything it accepts is re-validated in the action,
 * because nothing typed in a browser is trusted.
 *
 * Every input is controlled. React resets uncontrolled fields after a form
 * action returns, which would wipe a long letter on a single validation
 * error such as a missing postcode.
 */

type Sku = "single" | "pair";

const EMPTY_ADDRESS = {
  name: "",
  line1: "",
  line2: "",
  postcode: "",
  city: "",
  country: "DE",
};
type Address = typeof EMPTY_ADDRESS;

type Draft = {
  sku: Sku;
  body: string;
  body2: string;
  deliverOn: string;
  address: Address;
  address2: Address;
  sameAddress: boolean;
};

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Formatted by hand rather than with Intl so the server render and the
 * browser render always produce the same string, whatever ICU data each has.
 */
function longDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function daysBetween(from: string, to: string): number {
  return Math.round(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  );
}

const PRESETS = [
  ["6 months", 6],
  ["1 year", 12],
  ["2 years", 24],
  ["5 years", 60],
] as const;

const ADDRESS_FIELDS: {
  key: keyof Address;
  label: string;
  autoComplete: string;
  optional?: boolean;
  wide?: boolean;
}[] = [
  { key: "name", label: "Recipient’s name", autoComplete: "name", wide: true },
  {
    key: "line1",
    label: "Street and number",
    autoComplete: "address-line1",
    wide: true,
  },
  {
    key: "line2",
    label: "Flat, floor, or care of",
    autoComplete: "address-line2",
    optional: true,
    wide: true,
  },
  { key: "postcode", label: "Postcode", autoComplete: "postal-code" },
  { key: "city", label: "Town or city", autoComplete: "address-level2" },
];

function AddressFields({
  suffix = "",
  value,
  onChange,
  countries,
  invalidField,
}: {
  suffix?: string;
  value: Address;
  onChange: (next: Address) => void;
  countries: [string, string][];
  invalidField?: string;
}) {
  const section = suffix ? "section-second shipping" : "shipping";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {ADDRESS_FIELDS.map((f) => {
        const name = `${f.key}${suffix}`;
        return (
          <div key={f.key} className={f.wide ? "sm:col-span-2" : undefined}>
            <label htmlFor={name} className="block text-sm text-muted">
              {f.label}
              {f.optional ? " (optional)" : null}
            </label>
            <input
              id={name}
              name={name}
              required={!f.optional}
              autoComplete={`${section} ${f.autoComplete}`}
              value={value[f.key]}
              onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
              aria-invalid={invalidField === name || undefined}
              className="field"
            />
          </div>
        );
      })}
      <div className="sm:col-span-2">
        <label
          htmlFor={`country${suffix}`}
          className="block text-sm text-muted"
        >
          Country
        </label>
        <select
          id={`country${suffix}`}
          name={`country${suffix}`}
          required
          autoComplete={`${section} country`}
          value={value.country}
          onChange={(e) => onChange({ ...value, country: e.target.value })}
          aria-invalid={invalidField === `country${suffix}` || undefined}
          className="field"
        >
          {countries.map(([code, label]) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  hint,
  children,
}: {
  n: number;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-seal text-sm text-seal-ink"
        >
          {n}
        </span>
        <div>
          <h2 id={headingId} className="font-display text-2xl tracking-tight">
            {title}
          </h2>
          {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
        </div>
      </div>
      <div className="mt-6 sm:pl-12">{children}</div>
    </section>
  );
}

function LetterArea({
  id,
  name,
  value,
  onChange,
  max,
  placeholder,
  invalid,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  placeholder: string;
  invalid: boolean;
}) {
  const used = value.length;
  const ratio = Math.min(used / max, 1);
  return (
    <div>
      <textarea
        id={id}
        name={name}
        rows={14}
        required
        maxLength={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={`${id}-count`}
        className="field resize-y px-5 py-4 font-body text-[1.05rem] leading-relaxed"
      />
      <div className="mt-2 flex items-center gap-3">
        <div
          aria-hidden="true"
          className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2"
        >
          <div
            className={`h-full rounded-full transition-[width] ${ratio > 0.9 ? "bg-seal" : "bg-gold"}`}
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
        <p id={`${id}-count`} className="text-xs tabular-nums text-muted">
          {used.toLocaleString("en")} / {max.toLocaleString("en")} characters
        </p>
      </div>
    </div>
  );
}

function LetterPreview({
  body,
  address,
  deliverOn,
}: {
  body: string;
  address: Address;
  deliverOn: string;
}) {
  const addressLines = [
    address.name,
    address.line1,
    address.line2,
    [address.postcode, address.city].filter(Boolean).join(" "),
  ].filter(Boolean);

  return (
    <div className="card relative aspect-[1/1.3] overflow-hidden px-6 py-7 text-[0.8rem] leading-relaxed">
      <div className="flex items-start justify-between gap-4">
        <div className="min-h-16 text-muted">
          {addressLines.length ? (
            addressLines.map((line, i) => <p key={i}>{line}</p>)
          ) : (
            <p className="italic">Recipient address</p>
          )}
        </div>
        <p className="shrink-0 text-right text-muted">{longDate(deliverOn)}</p>
      </div>
      <div className="mt-6 whitespace-pre-wrap break-words">
        {body.trim() ? (
          body
        ) : (
          <span className="italic text-muted">
            Your letter appears here as you write.
          </span>
        )}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-paper to-transparent"
      />
    </div>
  );
}

function OrderSummary({
  sku,
  price,
  vat,
  deliverOn,
}: {
  sku: Sku;
  price: string;
  vat: string;
  deliverOn: string;
}) {
  return (
    <dl className="space-y-2.5 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-muted">Package</dt>
        <dd>{sku === "pair" ? "A couple’s pair" : "One sealed letter"}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted">Posted on</dt>
        <dd className="text-right">{deliverOn}</dd>
      </div>
      <div className="flex justify-between gap-4 border-t border-line pt-2.5">
        <dt className="font-display text-base">Total</dt>
        <dd className="font-display text-base">{price}</dd>
      </div>
      <p className="text-xs text-muted">Includes {vat} VAT at 19%.</p>
    </dl>
  );
}

export function ComposeForm({
  today,
  minDate,
  defaultDate,
  maxDate,
  bodyMaxChars,
  prices,
  vat,
  prompts,
  countries,
  initialSku,
}: {
  today: string;
  minDate: string;
  defaultDate: string;
  maxDate: string;
  bodyMaxChars: number;
  prices: Record<Sku, string>;
  vat: Record<Sku, string>;
  prompts: readonly string[];
  countries: [string, string][];
  initialSku: Sku;
}) {
  const [state, formAction, pending] = useActionState<ComposeState, FormData>(
    composeLetter,
    {},
  );

  const [sku, setSku] = useState<Sku>(initialSku);
  const [body, setBody] = useState("");
  const [body2, setBody2] = useState("");
  const [deliverOn, setDeliverOn] = useState(defaultDate);
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [address2, setAddress2] = useState<Address>(EMPTY_ADDRESS);
  const [sameAddress, setSameAddress] = useState(true);
  const [previewSecond, setPreviewSecond] = useState(false);
  const [restored, setRestored] = useState(false);
  // State, not a ref: saving must wait for the render that carries the
  // restored values, or the first save writes the empty defaults over the
  // draft it was about to restore.
  const [loaded, setLoaded] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const bodyId = useId();
  const body2Id = useId();
  const errorId = useId();

  // Restore a draft from this tab once, after hydration. Reading storage
  // during render would make the server and browser HTML disagree.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw) as Partial<Draft>;
        /* eslint-disable react-hooks/set-state-in-effect -- one-time sync
           from browser storage, which does not exist during render */
        if (d.sku === "pair" || d.sku === "single") setSku(d.sku);
        if (typeof d.body === "string") setBody(d.body);
        if (typeof d.body2 === "string") setBody2(d.body2);
        if (
          typeof d.deliverOn === "string" &&
          d.deliverOn >= minDate &&
          d.deliverOn <= maxDate
        ) {
          setDeliverOn(d.deliverOn);
        }
        if (d.address) setAddress({ ...EMPTY_ADDRESS, ...d.address });
        if (d.address2) setAddress2({ ...EMPTY_ADDRESS, ...d.address2 });
        if (typeof d.sameAddress === "boolean") setSameAddress(d.sameAddress);
        if (d.body?.trim()) setRestored(true);
      }
    } catch {
      // Storage can be blocked or full. The draft is a convenience; the form
      // works the same without it.
    }
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [minDate, maxDate]);

  useEffect(() => {
    if (!loaded) return;
    const draft: Draft = {
      sku,
      body,
      body2,
      deliverOn,
      address,
      address2,
      sameAddress,
    };
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // See above: a missing draft is not an error worth showing.
    }
  }, [loaded, sku, body, body2, deliverOn, address, address2, sameAddress]);

  // Put the cursor on whatever the server rejected.
  useEffect(() => {
    if (!state.field) return;
    const el = formRef.current?.elements.namedItem(state.field);
    if (el instanceof HTMLElement) el.focus();
  }, [state]);

  const days = daysBetween(today, deliverOn);
  const dateValid = deliverOn >= minDate && deliverOn <= maxDate;
  const isPair = sku === "pair";
  const showingSecond = isPair && previewSecond;
  const summary = (
    <OrderSummary
      sku={sku}
      price={prices[sku]}
      vat={vat[sku]}
      deliverOn={dateValid ? longDate(deliverOn) : "Not set"}
    />
  );

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14"
    >
      <div className="space-y-14">
        {restored ? (
          <div className="flex items-start justify-between gap-4 rounded-lg border border-sage/30 bg-sage-soft px-5 py-4 text-sm text-sage">
            <p>
              We restored your draft from this tab. It is kept only until the
              tab is closed.
            </p>
            <button
              type="button"
              className="shrink-0 underline underline-offset-4"
              onClick={() => {
                setBody("");
                setBody2("");
                setAddress(EMPTY_ADDRESS);
                setAddress2(EMPTY_ADDRESS);
                setRestored(false);
              }}
            >
              Start over
            </button>
          </div>
        ) : null}

        <Step n={1} title="Choose what to send">
          <fieldset>
            <legend className="sr-only">Package</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["single", "One sealed letter", "For one recipient"],
                  ["pair", "A couple’s pair", "Two letters, one date"],
                ] as const
              ).map(([value, title, note]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer flex-col rounded-lg border p-5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-seal ${
                    sku === value
                      ? "border-seal bg-seal-soft"
                      : "border-line-strong bg-paper hover:border-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="sku"
                    value={value}
                    checked={sku === value}
                    onChange={() => setSku(value)}
                    className="sr-only"
                  />
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-lg">{title}</span>
                    <span className="font-display text-lg">
                      {prices[value]}
                    </span>
                  </span>
                  <span className="mt-1 text-sm text-muted">{note}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </Step>

        <Step
          n={2}
          title={isPair ? "Write your letters" : "Write your letter"}
          hint="Write the way you would speak. Take as long as you need."
        >
          <div className="rounded-lg border border-line bg-surface px-5 py-4">
            <p className="flex items-center gap-2 text-sm text-gold-text">
              <SparkIcon className="size-4" />
              Ideas to begin
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              {prompts.map((p) => (
                <li key={p} className="flex gap-2">
                  <span aria-hidden="true" className="text-gold">
                    ·
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <label htmlFor={bodyId} className="mb-1 block text-sm text-muted">
              {isPair ? "First letter" : "Your letter"}
            </label>
            <LetterArea
              id={bodyId}
              name="body"
              value={body}
              onChange={setBody}
              max={bodyMaxChars}
              placeholder="Dear…"
              invalid={state.field === "body"}
            />
          </div>

          {isPair ? (
            <div className="mt-8">
              <label
                htmlFor={body2Id}
                className="mb-1 block text-sm text-muted"
              >
                Second letter, sealed separately
              </label>
              <LetterArea
                id={body2Id}
                name="body_2"
                value={body2}
                onChange={setBody2}
                max={bodyMaxChars}
                placeholder="The other half of the pair."
                invalid={state.field === "body_2"}
              />
            </div>
          ) : null}

          <details className="mt-6 lg:hidden">
            <summary className="cursor-pointer text-sm text-seal">
              Preview how it will look
            </summary>
            <div className="mt-4">
              <LetterPreview
                body={body}
                address={address}
                deliverOn={deliverOn}
              />
            </div>
          </details>
        </Step>

        <Step
          n={3}
          title="Choose the delivery date"
          hint={
            isPair
              ? "Both letters are posted on this date."
              : "Most people choose their first anniversary."
          }
        >
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(([label, months]) => {
              const candidate = addMonths(today, months);
              const value = candidate > maxDate ? maxDate : candidate;
              const active = value === deliverOn;
              return (
                <button
                  key={label}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setDeliverOn(value)}
                  className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                    active
                      ? "border-seal bg-seal text-seal-ink"
                      : "border-line-strong bg-paper hover:border-muted"
                  }`}
                >
                  In {label}
                </button>
              );
            })}
          </div>

          <label htmlFor="deliverOn" className="mt-5 block text-sm text-muted">
            Or pick an exact date
          </label>
          {/* Native date input: no picker dependency, and it gets the mobile
              keyboard right for free. Bounds are computed per request on the
              server and checked again by the action. */}
          <input
            type="date"
            id="deliverOn"
            name="deliverOn"
            required
            min={minDate}
            max={maxDate}
            value={deliverOn}
            onChange={(e) => setDeliverOn(e.target.value)}
            aria-invalid={state.field === "deliverOn" || undefined}
            className="field max-w-xs"
          />
          {dateValid ? (
            <p className="mt-3 flex items-center gap-2 text-sm">
              <CalendarIcon className="size-4 shrink-0 text-seal" />
              <span>
                Posted on{" "}
                <strong className="font-semibold">{longDate(deliverOn)}</strong>
                <span className="text-muted">
                  , {days.toLocaleString("en")} {days === 1 ? "day" : "days"}{" "}
                  from today
                </span>
              </span>
            </p>
          ) : (
            <p className="mt-3 text-sm text-seal">
              Choose a date between {longDate(minDate)} and {longDate(maxDate)}.
            </p>
          )}
        </Step>

        <Step
          n={4}
          title="Where should we post it?"
          hint="About a week before posting, we email you this address so you can correct it if it has changed."
        >
          <AddressFields
            value={address}
            onChange={setAddress}
            countries={countries}
            invalidField={state.field}
          />

          {isPair ? (
            <div className="mt-8 rounded-lg border border-line bg-surface p-5">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="sameAddress"
                  checked={sameAddress}
                  onChange={(e) => setSameAddress(e.target.checked)}
                  className="mt-1 size-4 accent-seal"
                />
                <span>Post the second letter to the same address.</span>
              </label>

              {/* Only rendered when needed, so the browser never blocks
                  submission on a required field nobody can see. */}
              {sameAddress ? null : (
                <div className="mt-6">
                  <h3 className="mb-4 font-display text-lg">
                    Address for the second letter
                  </h3>
                  <AddressFields
                    suffix="_2"
                    value={address2}
                    onChange={setAddress2}
                    countries={countries}
                    invalidField={state.field}
                  />
                </div>
              )}
            </div>
          ) : null}
        </Step>

        <Step n={5} title="Confirm and pay">
          {/* Neither box is pre-ticked, and both are required. What was
              agreed is stored verbatim against the order, so this wording
              is versioned in lib/consent.ts. */}
          <div className="space-y-4">
            <label className="flex gap-3 text-sm leading-relaxed">
              <input
                type="checkbox"
                name="art9"
                required
                aria-invalid={state.field === "art9" || undefined}
                className="mt-1 size-4 shrink-0 accent-seal"
              />
              <span>
                I understand my letter is stored encrypted until its delivery
                date, and I consent to it being held even if it contains
                personal details about health, beliefs, or relationships.
              </span>
            </label>
            <label className="flex gap-3 text-sm leading-relaxed">
              <input
                type="checkbox"
                name="withdrawal"
                required
                aria-invalid={state.field === "withdrawal" || undefined}
                className="mt-1 size-4 shrink-0 accent-seal"
              />
              <span>
                I understand I can cancel a pending letter at any time before
                it is posted, and that cancelling deletes the letter itself.
              </span>
            </label>
          </div>

          <div className="mt-8 rounded-lg border border-line bg-surface p-5 lg:hidden">
            {summary}
          </div>

          {state.error ? (
            <p
              id={errorId}
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-lg border border-seal/40 bg-seal-soft px-4 py-3 text-seal"
            >
              <AlertIcon className="mt-0.5 size-5 shrink-0" />
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            aria-describedby={state.error ? errorId : undefined}
            className="btn btn-primary mt-8 w-full py-4 text-lg sm:w-auto sm:px-10"
          >
            <LockIcon className="size-5" />
            {pending
              ? "Preparing secure payment…"
              : isPair
                ? `Seal both and pay ${prices.pair}`
                : `Seal it and pay ${prices.single}`}
          </button>
          <p className="mt-3 text-sm text-muted">
            You pay on Stripe’s secure page. If you return without paying,
            nothing is charged and your draft stays in this tab.
          </p>
        </Step>
      </div>

      <aside className="hidden lg:block" aria-label="Preview and summary">
        <div className="sticky top-24 space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="eyebrow">Preview</p>
              {isPair ? (
                <div className="flex rounded-full border border-line-strong p-0.5 text-xs">
                  {[false, true].map((second) => (
                    <button
                      key={String(second)}
                      type="button"
                      aria-pressed={previewSecond === second}
                      onClick={() => setPreviewSecond(second)}
                      className={`rounded-full px-3 py-1 ${
                        previewSecond === second
                          ? "bg-ink text-bg"
                          : "text-muted"
                      }`}
                    >
                      {second ? "Second" : "First"}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <LetterPreview
              body={showingSecond ? body2 : body}
              address={showingSecond && !sameAddress ? address2 : address}
              deliverOn={deliverOn}
            />
          </div>
          <div className="card p-5">{summary}</div>
        </div>
      </aside>
    </form>
  );
}
