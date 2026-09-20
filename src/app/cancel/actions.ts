"use server";

import type { CancelState } from "@/lib/consent.ts";
import { withdrawByToken } from "@/lib/withdraw.ts";

export async function cancelLetter(
  _previous: CancelState,
  formData: FormData,
): Promise<CancelState> {
  const token = String(formData.get("token") ?? "");

  try {
    const outcome = await withdrawByToken(token);

    if (outcome.ok) {
      return {
        done: true,
        message: outcome.refunded
          ? "Your letter has been deleted and your payment refunded. The refund usually appears within a few working days."
          : "Your letter has been deleted. There was no payment to refund.",
      };
    }

    switch (outcome.reason) {
      case "already_withdrawn":
        return { message: "This letter has already been cancelled." };
      case "already_sent":
        return {
          error:
            "This letter has already gone to the printers, so we can no longer stop it. Email us and we will tell you what happened to it.",
        };
      default:
        // Deliberately identical for a wrong token and an unknown one — this
        // form must not become a way to test whether a token is real.
        return {
          error:
            "We could not find a pending letter for that reference. Check it against your confirmation page.",
        };
    }
  } catch (error) {
    // Never echo the underlying error: it can carry row data.
    console.error("Withdrawal failed", error);
    return {
      error: "Something went wrong cancelling this letter. Please email us.",
    };
  }
}
