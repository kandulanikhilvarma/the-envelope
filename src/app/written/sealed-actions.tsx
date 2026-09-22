"use client";

import { useEffect, useState } from "react";
import { CalendarIcon, CheckIcon, CopyIcon } from "@/components/icons.tsx";
import { DRAFT_KEY } from "@/lib/draft.ts";
import { letterCalendarFile } from "@/lib/ics.ts";

/** The letter is paid for and sealed, so the tab's draft has done its job. */
export function ClearDraft() {
  useEffect(() => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      // Blocked storage has nothing in it to clear.
    }
  }, []);
  return null;
}

export function CopyReference({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
      <code className="flex-1 break-all rounded-md border border-line bg-bg px-4 py-3 font-mono text-sm">
        {token}
      </code>
      <button
        type="button"
        className="btn btn-secondary shrink-0 py-3 text-sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(token);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          } catch {
            // Clipboard access can be refused; the reference stays visible
            // and selectable, which is the fallback.
          }
        }}
      >
        {copied ? (
          <CheckIcon className="size-4 text-sage" />
        ) : (
          <CopyIcon className="size-4" />
        )}
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  );
}

export function AddToCalendar({
  deliverOn,
  recipients,
  orderId,
}: {
  deliverOn: string;
  recipients: string[];
  orderId: string;
}) {
  return (
    <button
      type="button"
      className="btn btn-secondary text-sm"
      onClick={() => {
        const ics = letterCalendarFile({
          deliverOn,
          summary: `Your letter to ${recipients.join(" and ")} is posted today`,
          description:
            "The Envelope prints and posts your sealed letter today. We emailed you an address check about a week before.",
          uid: `${orderId}@the-envelope`,
        });
        const url = URL.createObjectURL(
          new Blob([ics], { type: "text/calendar;charset=utf-8" }),
        );
        const a = document.createElement("a");
        a.href = url;
        a.download = "the-envelope-letter.ics";
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      <CalendarIcon className="size-4" />
      Add the date to my calendar
    </button>
  );
}
