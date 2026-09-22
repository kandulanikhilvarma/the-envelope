/**
 * Proves the app can actually reach everything it depends on.
 *
 * Unit tests cover the logic; this covers the wiring, which is the part that
 * is wrong on launch day. Every check talks to the real service using the
 * credentials in the environment, and reports what it found without ever
 * printing a value.
 *
 *   npm run preflight
 *
 * Exit code is 1 if anything required failed, so a deploy step can gate on it.
 */

import { open, seal } from "../src/lib/crypto.ts";
import { db } from "../src/lib/db.ts";
import { operatorEmail } from "../src/lib/email.ts";
import { stripe } from "../src/lib/stripe.ts";

type Status = "pass" | "fail" | "warn";
type Check = { name: string; status: Status; detail: string };

const results: Check[] = [];

/**
 * PostgREST sometimes returns an error whose message is empty, a HEAD
 * request has no body to put one in. Falling back to the code and hint keeps
 * the report from printing a bare table name and nothing else.
 */
function describe(error: {
  message?: string;
  code?: string;
  hint?: string | null;
  details?: string | null;
}): string {
  return (
    [error.message, error.code, error.details, error.hint]
      .filter((part) => part)
      .join(" / ") || "failed with no message"
  );
}

function record(name: string, status: Status, detail: string): void {
  results.push({ name, status, detail });
}

async function check(
  name: string,
  run: () => Promise<string>,
  { required = true } = {},
): Promise<void> {
  try {
    record(name, "pass", await run());
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    record(name, required ? "fail" : "warn", message.slice(0, 160));
  }
}

// ── Environment ──────────────────────────────────────────────────────
// Names only. A preflight that prints secrets is a preflight you cannot run
// in CI or paste into a support thread.

const REQUIRED = [
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "LETTER_ENCRYPTION_KEYRING",
  "LETTER_ENCRYPTION_ACTIVE_VERSION",
  "PINGEN_CLIENT_ID",
  "PINGEN_CLIENT_SECRET",
  "PINGEN_ORGANISATION_ID",
  "CRON_SECRET",
];

const RECOMMENDED = ["RESEND_API_KEY", "EMAIL_FROM", "OPERATOR_EMAIL"];

function checkEnv(): void {
  const missing = REQUIRED.filter((name) => !process.env[name]);
  record(
    "environment",
    missing.length === 0 ? "pass" : "fail",
    missing.length === 0
      ? `all ${REQUIRED.length} required variables set`
      : `missing: ${missing.join(", ")}`,
  );

  const absent = RECOMMENDED.filter((name) => !process.env[name]);
  record(
    "environment (email)",
    absent.length === 0 ? "pass" : "warn",
    absent.length === 0
      ? "confirmation, notice and operator alerts can be sent"
      : `missing: ${absent.join(", ")}, those messages will be logged and skipped`,
  );

  const secret = process.env.CRON_SECRET ?? "";
  record(
    "cron secret strength",
    secret.length >= 32 ? "pass" : secret ? "warn" : "fail",
    secret ? `${secret.length} characters` : "not set",
  );
}

// ── Encryption ───────────────────────────────────────────────────────

async function checkCrypto(): Promise<void> {
  await check("encryption keyring", async () => {
    const plaintext = `preflight ${Date.now()}`;
    const sealed = seal(plaintext);
    if (open(sealed) !== plaintext) {
      throw new Error("round trip did not return the original text");
    }
    return `sealed and opened under key version ${sealed.keyVersion}`;
  });
}

// ── Supabase ─────────────────────────────────────────────────────────

async function checkDatabase(): Promise<void> {
  await check("database, tables", async () => {
    const supabase = db();
    const counts: string[] = [];

    for (const table of ["orders", "letters", "consent_log", "rate_limit"]) {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      if (error) throw new Error(`${table}: ${describe(error)}`);
      counts.push(`${table} ${count ?? 0}`);
    }

    return counts.join(", ");
  });

  // Reads only. Calling claim_due_letters() here would mark real letters as
  // 'sending' and strand them, so it is deliberately not exercised.
  await check("database, notice column", async () => {
    const { error } = await db().from("letters").select("notified_at").limit(1);
    if (error) throw new Error(describe(error));
    return "letters.notified_at present (migration 0004 applied)";
  });

  await check("database, overdue_letter_count()", async () => {
    const { data, error } = await db().rpc("overdue_letter_count");
    if (error) throw new Error(describe(error));
    return `${data ?? 0} overdue`;
  });

  await check("database, rate limiter", async () => {
    const { data, error } = await db().rpc("consume_rate_limit", {
      p_bucket: `preflight:${Date.now()}`,
      p_limit: 1,
      p_window_seconds: 60,
    });
    if (error) throw new Error(describe(error));
    if (data !== true) throw new Error("first call was already rejected");
    return "consume_rate_limit() reachable (migration 0005 applied)";
  });
}

// ── Stripe ───────────────────────────────────────────────────────────

async function checkStripe(): Promise<void> {
  await check("stripe", async () => {
    const balance = await stripe().balance.retrieve();
    const mode = balance.livemode ? "LIVE" : "test";
    const currencies = balance.available.map((a) => a.currency).join(", ");
    return `key valid, ${mode} mode, balance currencies: ${currencies || "none"}`;
  });

  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? "";
  record(
    "stripe webhook secret",
    secret.startsWith("whsec_") ? "pass" : "fail",
    secret.startsWith("whsec_")
      ? "looks like a signing secret"
      : "does not start with whsec_",
  );
}

// ── Pingen ───────────────────────────────────────────────────────────

async function checkPingen(): Promise<void> {
  await check("pingen", async () => {
    const response = await fetch(
      "https://identity.pingen.com/auth/access-tokens",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: process.env.PINGEN_CLIENT_ID,
          client_secret: process.env.PINGEN_CLIENT_SECRET,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `auth returned ${response.status}: ${(await response.text()).slice(0, 120)}`,
      );
    }

    const base =
      process.env.PINGEN_API_BASE ?? "https://api-staging.pingen.com";
    const live = !base.includes("staging");
    return `authenticated against ${live ? "LIVE" : "staging"} (${base})`;
  });
}

// ── Email ────────────────────────────────────────────────────────────

async function checkEmail(): Promise<void> {
  await check(
    "email provider",
    async () => {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) throw new Error("RESEND_API_KEY not set");

      const response = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!response.ok) {
        throw new Error(
          `domains returned ${response.status}: ${(await response.text()).slice(0, 120)}`,
        );
      }

      const json = (await response.json()) as {
        data?: { name: string; status: string }[];
      };
      const domains = json.data ?? [];
      const verified = domains.filter((d) => d.status === "verified");
      if (verified.length === 0) {
        throw new Error(
          `key valid but no verified sending domain (${domains.length} configured)`,
        );
      }
      return `verified domains: ${verified.map((d) => d.name).join(", ")}`;
    },
    { required: false },
  );

  record(
    "operator alerts",
    operatorEmail() ? "pass" : "warn",
    operatorEmail()
      ? "a failed dispatch will reach a human"
      : "OPERATOR_EMAIL unset, failures only reach the logs",
  );
}

// ── Report ───────────────────────────────────────────────────────────

const MARK: Record<Status, string> = {
  pass: "PASS",
  fail: "FAIL",
  warn: "WARN",
};

async function main(): Promise<void> {
  checkEnv();
  await checkCrypto();
  await checkDatabase();
  await checkStripe();
  await checkPingen();
  await checkEmail();

  const width = Math.max(...results.map((r) => r.name.length));
  console.log("");
  for (const result of results) {
    console.log(
      `  ${MARK[result.status]}  ${result.name.padEnd(width)}  ${result.detail}`,
    );
  }

  const failed = results.filter((r) => r.status === "fail").length;
  const warned = results.filter((r) => r.status === "warn").length;
  console.log(
    `\n  ${results.length - failed - warned} passed, ${warned} warning(s), ${failed} failure(s)\n`,
  );

  if (failed > 0) {
    console.log("  Not ready to take money. Fix the failures above.\n");
    process.exitCode = 1;
    return;
  }

  console.log(
    warned > 0
      ? "  Wiring is sound. The warnings are things that will bite later, not now.\n"
      : "  Every dependency answered. Post yourself a test letter next.\n",
  );
}

await main();
