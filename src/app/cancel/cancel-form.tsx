"use client";

import { useActionState } from "react";
import type { CancelState } from "@/lib/consent.ts";
import { cancelLetter } from "./actions.ts";

const FIELD =
  "mt-1 w-full rounded-sm border border-line bg-bg px-3 py-2 font-mono text-ink " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seal";

export function CancelForm() {
  const [state, formAction, pending] = useActionState<CancelState, FormData>(
    cancelLetter,
    {},
  );

  if (state.done) {
    return (
      <div className="mt-8 rounded-sm border border-line bg-surface p-6">
        <p className="font-display text-xl">Done.</p>
        <p className="mt-2 text-muted">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-8 max-w-md">
      <label htmlFor="token" className="block text-sm text-muted">
        Your reference
      </label>
      <input
        id="token"
        name="token"
        required
        autoComplete="off"
        spellCheck={false}
        placeholder="0000aaaa-0000-0000-0000-000000000000"
        className={FIELD}
      />

      {state.error ? (
        <p role="alert" className="mt-3 text-seal">
          {state.error}
        </p>
      ) : null}
      {state.message && !state.done ? (
        <p className="mt-3 text-muted">{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 rounded-sm bg-seal px-6 py-3 text-seal-ink transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-seal"
      >
        {pending ? "Cancelling…" : "Cancel and delete my letter"}
      </button>
    </form>
  );
}
