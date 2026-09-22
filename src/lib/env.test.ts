import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { siteUrl } from "./env.ts";

const KEYS = [
  "NEXT_PUBLIC_SITE_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
  "VERCEL_URL",
];

const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

function set(values: Record<string, string | undefined>): void {
  for (const key of KEYS) {
    const value = values[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("siteUrl", () => {
  it("prefers the explicit value and drops a trailing slash", () => {
    set({ NEXT_PUBLIC_SITE_URL: "https://theenvelope.example/" });
    assert.equal(siteUrl(), "https://theenvelope.example");
  });

  it("falls back to Vercel's production host, not the preview host", () => {
    set({
      VERCEL_PROJECT_PRODUCTION_URL: "the-envelope.vercel.app",
      VERCEL_URL: "the-envelope-git-branch.vercel.app",
    });
    // A confirmation email outlives the preview deploy that sent it, so the
    // cancel link has to point at the production host.
    assert.equal(siteUrl(), "https://the-envelope.vercel.app");
  });

  it("uses the preview host when that is all there is", () => {
    set({ VERCEL_URL: "the-envelope-git-branch.vercel.app" });
    assert.equal(siteUrl(), "https://the-envelope-git-branch.vercel.app");
  });

  it("falls back to localhost off Vercel", () => {
    set({});
    assert.equal(siteUrl(), "http://localhost:3000");
  });
});
