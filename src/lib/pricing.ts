/**
 * Prices are stored gross (what the customer is charged) because that is
 * what Stripe takes and what the customer agreed to. VAT is derived from the
 * gross figure, not added to it.
 */

export const VAT_RATE = 0.19; // German standard rate

export const SKUS = {
  single: { label: "One sealed letter", grossCents: 1900 },
  pair: { label: "A couple's pair", grossCents: 2900 },
} as const;

export type Sku = keyof typeof SKUS;

export function isSku(value: string): value is Sku {
  return Object.hasOwn(SKUS, value);
}

export type PriceBreakdown = {
  grossCents: number;
  netCents: number;
  vatCents: number;
};

/**
 * Splits a gross amount into net + VAT.
 *
 * Rounds VAT and derives net by subtraction so the two always add back to
 * exactly the gross. Rounding both independently can leave you a cent short
 * of what was actually charged.
 */
export function breakdown(sku: Sku): PriceBreakdown {
  const grossCents = SKUS[sku].grossCents;
  const vatCents = Math.round(grossCents - grossCents / (1 + VAT_RATE));
  return { grossCents, netCents: grossCents - vatCents, vatCents };
}

export function formatEur(cents: number): string {
  return `€${(cents / 100).toFixed(2)}`;
}
