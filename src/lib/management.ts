import type { LetterStatus } from "./db.ts";
import type { Recipient } from "./letters.ts";

/** Delivery metadata only. Encrypted content is never selected for management. */
export type ManagedLetter = {
  id: string;
  deliverOn: string;
  status: LetterStatus;
  sentAt: string | null;
  recipient: Recipient;
};

export type ManagedOrder = {
  sku: "single" | "pair";
  status: "pending" | "paid" | "refunded";
  letters: ManagedLetter[];
};

export type ManageState = { order?: ManagedOrder; error?: string };
export type AddressState = {
  letter?: ManagedLetter;
  error?: string;
  field?: string;
  locked?: boolean;
};

// Match the worker's claimable states. Failed letters can have an address
// corrected, but correcting one must never restart fulfilment or reset attempts.
export const ADDRESS_EDITABLE = ["scheduled", "retry", "failed"] as const;

export function canEditAddress(status: LetterStatus): boolean {
  return ADDRESS_EDITABLE.some((allowed) => allowed === status);
}

export const LETTER_STATUS: Record<LetterStatus, { label: string; detail: string }> = {
  pending_payment: {
    label: "Awaiting payment",
    detail: "Your letter will be scheduled once payment is confirmed.",
  },
  scheduled: {
    label: "Sealed and waiting",
    detail: "Your letter stays encrypted until it is prepared for printing.",
  },
  retry: {
    label: "Posting delayed",
    detail: "Posting did not complete. The dispatch worker will try again.",
  },
  failed: {
    label: "Posting needs attention",
    detail: "Automatic posting attempts have stopped. Contact us using the Impressum.",
  },
  sending: {
    label: "Preparing for post",
    detail: "Printing has begun. The address can no longer be changed.",
  },
  sent: {
    label: "Submitted for posting",
    detail: "Your letter has been accepted by our print and post provider. This is not a delivery confirmation.",
  },
  withdrawn: {
    label: "Cancelled and deleted",
    detail: "The encrypted letter has been deleted and will not be posted.",
  },
};
