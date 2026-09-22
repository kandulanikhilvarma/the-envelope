import path from "node:path";
import type { NextConfig } from "next";

/**
 * Response headers applied to every route.
 *
 * No Content-Security-Policy here on purpose: Next injects inline scripts for
 * hydration, so a useful CSP needs a per-request nonce through middleware.
 * Shipping a policy loose enough to allow 'unsafe-inline' would be decoration
 * rather than protection, and the honest note is worth more than the header.
 */
const securityHeaders = [
  // Two years, preloadable. The site is HTTPS-only on Vercel anyway; this
  // closes the first plaintext request.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // A cancel form inside someone else's frame is a clickjacking target.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Keeps a cancel token out of any other origin's reach.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Without this, Turbopack walks up and picks a lockfile in the home
  // directory as the workspace root.
  turbopack: { root: path.resolve(__dirname) },

  // The framework version is free reconnaissance.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
