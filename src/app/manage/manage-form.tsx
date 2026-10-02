"use client";

import Link from "next/link";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { AddressFields, EMPTY_ADDRESS, type PostalAddress } from "@/components/address-fields.tsx";
import { AlertIcon, ArrowRightIcon, CheckIcon, LockIcon, MailIcon } from "@/components/icons.tsx";
import { canEditAddress, LETTER_STATUS, type AddressState, type ManagedLetter, type ManagedOrder, type ManageState } from "@/lib/management.ts";
import { changeAddress, findLetters } from "./actions.ts";

function dateLabel(iso: string) {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}

function Feedback({ id, children }: { id?: string; children: string }) {
  return (
    <p id={id} role="alert" className="mt-5 flex items-start gap-3 rounded-md bg-seal-soft px-4 py-3 text-sm leading-relaxed text-seal">
      <AlertIcon className="mt-0.5 size-5 shrink-0" />
      {children}
    </p>
  );
}

function AddressEditor({ letter, token, countries, onSaved, onClose }: {
  letter: ManagedLetter;
  token: string;
  countries: [string, string][];
  onSaved: (letter: ManagedLetter) => void;
  onClose: (refresh: boolean) => void;
}) {
  const [state, action, pending] = useActionState<AddressState, FormData>(changeAddress, {});
  const [address, setAddress] = useState<PostalAddress>({ ...EMPTY_ADDRESS, ...letter.recipient });
  const formRef = useRef<HTMLFormElement>(null);
  const errorId = useId();

  useEffect(() => {
    const first = formRef.current?.elements.namedItem("name");
    if (first instanceof HTMLElement) first.focus();
  }, []);

  useEffect(() => {
    if (state.letter) onSaved(state.letter);
    if (state.field) {
      const field = formRef.current?.elements.namedItem(state.field);
      if (field instanceof HTMLElement) field.focus();
    }
  }, [state, onSaved]);

  return (
    <form ref={formRef} action={action} className="mt-6 border-t border-line pt-6">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="letterId" value={letter.id} />
      <fieldset disabled={pending || state.locked}>
        <legend className="mb-4 font-display text-xl">Update the destination</legend>
        <AddressFields value={address} onChange={setAddress} countries={countries} invalidField={state.field} errorId={errorId} />
      </fieldset>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        This changes the address for this letter only. Its words and posting date stay the same.
      </p>
      {state.error ? <Feedback id={errorId}>{state.error}</Feedback> : null}
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending || state.locked} className="btn btn-primary text-sm">
          {pending ? "Saving address…" : "Save new address"}
        </button>
        <button type="button" disabled={pending} onClick={() => onClose(!!state.locked)} className="btn btn-secondary text-sm">
          {state.locked ? "Close and refresh status" : "Keep current address"}
        </button>
      </div>
    </form>
  );
}

function LetterRecord({ letter, index, pair, paid, token, countries, onRefresh }: {
  letter: ManagedLetter;
  index: number;
  pair: boolean;
  paid: boolean;
  token: string;
  countries: [string, string][];
  onRefresh: () => void;
}) {
  const [current, setCurrent] = useState(letter);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const editRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const status = LETTER_STATUS[current.status];
  const editable = paid && canEditAddress(current.status);
  const posted = current.status === "sent";
  const active = current.status === "sending";
  const cancelled = current.status === "withdrawn";
  const needsAttention = current.status === "retry" || current.status === "failed";
  const recipient = current.recipient;
  const country = countries.find(([code]) => code === recipient.country)?.[1] ?? recipient.country;

  // Closing an editor returns focus to a meaningful control in this record.
  function closeEditor(refresh: boolean) {
    setEditing(false);
    if (refresh) onRefresh();
    else requestAnimationFrame(() => editRef.current?.focus());
  }

  return (
    <article aria-labelledby={titleId} className="border-t border-line py-8 sm:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 id={titleId} ref={headingRef} tabIndex={-1} className="break-words font-display text-2xl tracking-tight">
            {pair ? `${index === 0 ? "First" : "Second"} letter` : "Your letter"}
            <span className="block mt-1 text-lg text-muted">To {recipient.name}</span>
          </h3>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${needsAttention ? "bg-seal-soft text-seal" : cancelled ? "bg-surface text-muted" : "bg-sage-soft text-sage"}`}>
          {posted ? <CheckIcon className="size-4" /> : <LockIcon className="size-4" />}
          {status.label}
        </span>
      </div>

      {!cancelled && current.status !== "pending_payment" ? (
        <ol aria-label="Posting journey" className="mt-6 grid grid-cols-3 gap-3 text-xs sm:text-sm">
          {[
            { label: "Sealed", complete: true },
            { label: "Printing", complete: active || posted },
            { label: "Submitted for post", complete: posted },
          ].map((step) => (
            <li key={step.label} className={`border-t-2 pt-2 ${step.complete ? "border-sage text-sage" : "border-line-strong text-muted"}`}>
              {step.label}{step.complete ? <span className="sr-only">, reached</span> : <span className="sr-only">, not reached</span>}
            </li>
          ))}
        </ol>
      ) : null}
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted">{status.detail}</p>

      <div className="mt-7 grid gap-6 sm:grid-cols-[1fr_1.2fr]">
        <dl>
          <dt className="text-sm text-muted">{posted ? "Submitted on" : "Chosen posting date"}</dt>
          <dd className="mt-1 font-display text-xl">
            {dateLabel(posted && current.sentAt ? current.sentAt : current.deliverOn)}
          </dd>
          {!posted && !cancelled ? <p className="mt-2 text-sm text-muted">Arrival follows the postal service’s timings.</p> : null}
        </dl>
        <div>
          <p className="text-sm text-muted">{posted || active ? "Destination" : "Address on the envelope"}</p>
          <address className="mt-2 break-words not-italic leading-relaxed">
            {recipient.name}<br />
            {recipient.line1}<br />
            {recipient.line2 ? <>{recipient.line2}<br /></> : null}
            {recipient.postcode} {recipient.city}<br />
            {country}
          </address>
          {editable && !editing ? (
            <button ref={editRef} type="button" onClick={() => { setEditing(true); setSaved(false); }} className="btn btn-secondary mt-4 px-4 py-2.5 text-sm">
              Update this address <ArrowRightIcon className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
      {saved ? <p role="status" className="mt-5 flex items-center gap-2 text-sm text-sage"><CheckIcon className="size-4" />New address saved. Your letter stays sealed.</p> : null}
      {editing ? (
        <AddressEditor letter={current} token={token} countries={countries}
          onClose={closeEditor}
          onSaved={(updated) => {
            setCurrent(updated);
            setEditing(false);
            setSaved(true);
            requestAnimationFrame(() => headingRef.current?.focus());
          }}
        />
      ) : null}
    </article>
  );
}

function OrderRecords({ order, token, countries, onRefresh }: { order: ManagedOrder; token: string; countries: [string, string][]; onRefresh: () => void }) {
  return (
    <div>
      {order.status === "refunded" ? <p role="status" className="mb-5 text-sm text-muted">This order has been refunded.</p> : null}
      {order.letters.map((letter, index) => (
        <LetterRecord key={letter.id} letter={letter} index={index} pair={order.sku === "pair"} paid={order.status === "paid"} token={token} countries={countries} onRefresh={onRefresh} />
      ))}
    </div>
  );
}

export function ManageForm({ countries }: { countries: [string, string][] }) {
  const [state, action, pending] = useActionState<ManageState & { token: string; revision: number }, FormData>(
    async (previous, formData) => ({
      ...await findLetters(previous, formData),
      token: String(formData.get("token") ?? "").trim(),
      revision: previous.revision + 1,
    }),
    { token: "", revision: 0 },
  );
  const [token, setToken] = useState("");
  const [hidden, setHidden] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const tokenRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLHeadingElement>(null);
  const errorId = useId();
  const tokenId = useId();
  const hintId = useId();
  // The submitted reference is paired with its response, rather than read
  // from an editable input for later mutations. It exists only in memory.
  const visibleOrder = hidden || pending ? undefined : state.order;

  useEffect(() => {
    if (state.order) resultRef.current?.focus();
    if (state.error) tokenRef.current?.focus();
  }, [state]);

  function hideDetails() {
    setHidden(true);
    setToken("");
    requestAnimationFrame(() => tokenRef.current?.focus());
  }

  return (
    <div className="mt-10">
      <form ref={formRef} action={action} onSubmit={() => {
        setHidden(false);
      }} className="rounded-xl border border-line bg-paper p-5 sm:p-8">
        <label htmlFor={tokenId} className="block font-display text-xl">Your private reference</label>
        <p id={hintId} className="mt-2 text-sm leading-relaxed text-muted">
          Paste the reference from your confirmation email. Anyone with this reference can manage or cancel your letters.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start">
          <input
            ref={tokenRef} id={tokenId} name="token" required maxLength={100}
            autoComplete="off" autoCapitalize="none" spellCheck={false}
            value={token} disabled={pending || !!visibleOrder}
            onChange={(event) => setToken(event.target.value)}
            aria-invalid={state.error && !hidden ? true : undefined}
            aria-describedby={`${hintId}${state.error && !hidden ? ` ${errorId}` : ""}`}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="field m-0 min-w-0 flex-1 font-mono text-sm placeholder:text-muted disabled:opacity-60"
          />
          {/* Disabled inputs are omitted from FormData during a status refresh. */}
          {visibleOrder ? <input type="hidden" name="token" value={state.token} /> : null}
          <button type="submit" disabled={pending} className="btn btn-primary shrink-0 text-sm">
            {pending ? "Checking letters…" : visibleOrder ? "Refresh status" : "Find my letter"}
          </button>
        </div>
        {state.error && !hidden ? <Feedback id={errorId}>{state.error}</Feedback> : null}
        <p className="mt-4 text-sm text-muted">No account or password needed.</p>
      </form>

      {visibleOrder ? (
        <section aria-label="Your letter records" aria-busy={pending} className="mt-12">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h2 ref={resultRef} tabIndex={-1} className="font-display text-3xl tracking-tight">
              {visibleOrder.sku === "pair" ? "Your two sealed letters" : "Your sealed letter"}
            </h2>
            <button type="button" disabled={pending} onClick={hideDetails} className="link text-sm">Hide details & use another reference</button>
          </div>
          {/* Each successful lookup mounts fresh records; a refresh cannot
              retain an old editor after the worker changed its status. */}
          <OrderRecords key={state.revision} order={visibleOrder} token={state.token} countries={countries} onRefresh={() => formRef.current?.requestSubmit()} />
          <div className="flex items-start gap-3 border-t border-line pt-6 text-sm leading-relaxed text-muted">
            <MailIcon className="mt-0.5 size-5 shrink-0 text-seal" />
            <p>We also email an address check about a week before posting. You can return here any time before printing begins.</p>
          </div>
          <p className="mt-5 text-sm text-muted">
            Changed your mind? <Link href="/cancel" className="link">Cancel and delete your letter</Link> using the same reference.
          </p>
        </section>
      ) : (
        <p className="mt-7 max-w-2xl text-sm leading-relaxed text-muted">
          Cannot find your reference? Search your inbox for “Your letter is sealed”. If you still need help, use the contact details in our <Link href="/imprint" className="link">Impressum</Link>.
        </p>
      )}
    </div>
  );
}
