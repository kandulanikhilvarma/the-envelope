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

/**
 * The canonical origin, with no trailing slash.
 *
 * Falls back to the host Vercel injects, so a deploy made before anyone sets
 * NEXT_PUBLIC_SITE_URL still publishes its own address rather than
 * localhost — which would otherwise end up in robots.txt, the sitemap and
 * every Stripe redirect.
 *
 * Production host before preview host on purpose: a confirmation email can
 * outlive the preview deployment that sent it, and a dead preview URL is a
 * customer who cannot cancel.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost.replace(/\/$/, "")}`;

  return "http://localhost:3000";
}

export const aiDraftEnabled = () => process.env.ENABLE_AI_DRAFT === "true";
