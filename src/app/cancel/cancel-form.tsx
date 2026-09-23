"use client";

import { useActionState, useState } from "react";
import { AlertIcon, CheckIcon } from "@/components/icons.tsx";
import type { CancelState } from "@/lib/consent.ts";
import { cancelLetter } from "./actions.ts";

export function CancelForm() {
  const [state, formAction, pending] = useActionState<CancelState, FormData>(
    cancelLetter,
    {},
  );
  // Controlled so a rejected reference stays in the box to be corrected.
  const [token, setToken] = useState("");

  if (state.done) {
    return (
      <div
        role="status"
        className="card mt-10 flex gap-4 border-sage/30 bg-sage-soft p-6"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-paper text-sage">
          <CheckIcon className="size-5" />
        </span>
        <div>
          <p className="font-display text-xl">Cancelled and deleted.</p>
          <p className="mt-1 leading-relaxed text-muted">{state.message}</p>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="card mt-10 p-6 sm:p-8">
      <label htmlFor="token" className="block text-sm text-muted">
        Your reference
      </label>
      <input
        id="token"
        name="token"
        required
        autoComplete="off"
        spellCheck={false}
        value={token}
        onChange={(e) => setToken(e.target.value)}
        aria-invalid={state.error ? true : undefined}
        placeholder="0000aaaa-0000-0000-0000-000000000000"
        className="field font-mono"
      />

      <label className="mt-6 flex gap-3 text-sm leading-relaxed">
        <input
          type="checkbox"
          required
          className="mt-1 size-4 shrink-0 accent-seal"
        />
        <span>
          I understand this permanently deletes the letter and cannot be
          undone.
        </span>
      </label>

      {state.error ? (
        <p
          role="alert"
          className="mt-5 flex items-start gap-3 rounded-lg border border-seal/40 bg-seal-soft px-4 py-3 text-seal"
        >
          <AlertIcon className="mt-0.5 size-5 shrink-0" />
          {state.error}
        </p>
      ) : null}
      {state.message ? (
        <p role="status" className="mt-5 text-muted">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary mt-6 w-full sm:w-auto"
      >
        {pending ? "Cancelling…" : "Cancel and delete my letter"}
      </button>
    </form>
  );
}
