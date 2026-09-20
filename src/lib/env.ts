/**
 * Fail at the first use of a missing variable, with the variable's name in
 * the message. The alternative is a 500 whose stack points at a Stripe or
 * Supabase internal and tells you nothing.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export function siteUrl(): string {
  return optionalEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}

export const aiDraftEnabled = () => process.env.ENABLE_AI_DRAFT === "true";
