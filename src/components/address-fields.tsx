"use client";

import { useId } from "react";
import type { Recipient } from "@/lib/letters.ts";

export type PostalAddress = Required<Recipient>;
export const EMPTY_ADDRESS: PostalAddress = {
  name: "", line1: "", line2: "", postcode: "", city: "", country: "DE",
};

const FIELDS = [
  { key: "name", label: "Recipient’s name", autoComplete: "name", wide: true },
  { key: "line1", label: "Street and number", autoComplete: "address-line1", wide: true },
  { key: "line2", label: "Flat, floor, or care of (optional)", autoComplete: "address-line2", wide: true },
  { key: "postcode", label: "Postcode", autoComplete: "postal-code", wide: false },
  { key: "city", label: "Town or city", autoComplete: "address-level2", wide: false },
] as const;

/** Shared by checkout and management so the postal address has one vocabulary. */
export function AddressFields({
  suffix = "", value, onChange, countries, invalidField, errorId,
}: {
  suffix?: string;
  value: PostalAddress;
  onChange: (next: PostalAddress) => void;
  countries: [string, string][];
  invalidField?: string;
  errorId?: string;
}) {
  const section = suffix ? "section-second shipping" : "shipping";
  const prefix = useId();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {FIELDS.map((field) => {
        const name = `${field.key}${suffix}`;
        const id = `${prefix}-${name}`;
        const invalid = invalidField === name;
        return (
          <div key={field.key} className={field.wide ? "sm:col-span-2" : undefined}>
            <label htmlFor={id} className="block text-sm text-muted">{field.label}</label>
            <input
              id={id} name={name} required={field.key !== "line2"}
              autoComplete={`${section} ${field.autoComplete}`}
              value={value[field.key]}
              onChange={(event) => onChange({ ...value, [field.key]: event.target.value })}
              aria-invalid={invalid || undefined}
              aria-describedby={invalid ? errorId : undefined}
              className="field"
            />
          </div>
        );
      })}
      <div className="sm:col-span-2">
        <label htmlFor={`${prefix}-country`} className="block text-sm text-muted">Country</label>
        <select
          id={`${prefix}-country`} name={`country${suffix}`} required
          autoComplete={`${section} country`} value={value.country}
          onChange={(event) => onChange({ ...value, country: event.target.value })}
          aria-invalid={invalidField === `country${suffix}` || undefined}
          aria-describedby={invalidField === `country${suffix}` ? errorId : undefined}
          className="field"
        >
          {countries.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
        </select>
      </div>
    </div>
  );
}
