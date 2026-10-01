"use server";

import { headers } from "next/headers";
import { loadManagedOrder, updateManagedAddress } from "@/lib/manage.ts";
import type { AddressState, ManageState } from "@/lib/management.ts";
import { callerIp, MANAGE_LIMIT, withinLimit } from "@/lib/rate-limit.ts";

async function allowed(): Promise<boolean> {
  return withinLimit(MANAGE_LIMIT, callerIp(await headers()));
}

export async function findLetters(
  _previous: ManageState,
  formData: FormData,
): Promise<ManageState> {
  if (!(await allowed())) return { error: "Too many attempts. Wait a few minutes and try again." };
  try {
    return await loadManagedOrder(String(formData.get("token") ?? ""));
  } catch {
    // No token, address, database row or provider error goes into logs.
    console.error("Letter management lookup unavailable");
    return { error: "We cannot check your letters right now. Your letters are unchanged. Please try again shortly." };
  }
}

export async function changeAddress(
  _previous: AddressState,
  formData: FormData,
): Promise<AddressState> {
  if (!(await allowed())) return { error: "Too many attempts. Wait a few minutes and try again." };
  try {
    return await updateManagedAddress(
      String(formData.get("token") ?? ""),
      String(formData.get("letterId") ?? ""),
      {
        name: formData.get("name"),
        line1: formData.get("line1"),
        line2: formData.get("line2"),
        postcode: formData.get("postcode"),
        city: formData.get("city"),
        country: formData.get("country"),
      },
    );
  } catch {
    console.error("Letter address update unavailable");
    return { error: "We could not confirm the address update. Refresh the status before trying again." };
  }
}
