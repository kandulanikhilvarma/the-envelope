/**
 * The week-zero live test: post one real letter to yourself, end to end,
 * before any customer code is trusted with money.
 *
 * Nothing in src/lib/pingen.ts has ever been run against Pingen's servers.
 * The request shapes follow their v2 docs, but "follows the docs" and
 * "works" are different claims, and the gap between them is a letter that
 * silently never arrives.
 *
 * Usage — fill .env.local first, then:
 *
 *   node --env-file=.env.local scripts/pingen-test-letter.ts \
 *     --name "Your Name" \
 *     --line1 "Street 1" \
 *     --postcode "10115" \
 *     --city "Berlin" \
 *     --country DE
 *
 * Costs about EUR 1. Point PINGEN_API_BASE at staging first: staging
 * exercises the whole API without printing anything, which catches auth and
 * payload errors for free. Only then switch to production and post a real
 * one, because staging cannot tell you whether the address lands in the
 * envelope window.
 */

import { renderLetterPdf } from "../src/lib/pdf.ts";
import { sendLetter } from "../src/lib/pingen.ts";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const recipient = {
  name: arg("name"),
  line1: arg("line1"),
  line2: arg("line2"),
  postcode: arg("postcode"),
  city: arg("city"),
  country: (arg("country") ?? "DE").toUpperCase(),
};

const missing = (["name", "line1", "postcode", "city"] as const).filter(
  (k) => !recipient[k],
);
if (missing.length > 0) {
  console.error(`Missing: ${missing.map((m) => `--${m}`).join(", ")}`);
  process.exit(1);
}

const base = process.env.PINGEN_API_BASE ?? "(default: staging)";
console.log(`Pingen base : ${base}`);
console.log(
  `Recipient   : ${recipient.name}, ${recipient.postcode} ${recipient.city}`,
);

if (!base.includes("staging")) {
  console.log("");
  console.log("*** This is the PRODUCTION endpoint. It will print and post a");
  console.log("*** real letter and charge your account. Ctrl-C within 10s to stop.");
  await new Promise((r) => setTimeout(r, 10_000));
}

type Recipient = Parameters<typeof renderLetterPdf>[0]["recipient"];

const pdf = await renderLetterPdf({
  body: [
    "This is a test letter from The Envelope.",
    "",
    "If you are holding this, the whole pipeline works: the PDF rendered,",
    "Pingen accepted it, and Deutsche Post delivered it.",
    "",
    "Check three things before trusting it with a customer's letter:",
    "  1. The address showed through the envelope window.",
    "  2. The body text is not clipped at any margin.",
    "  3. It arrived close to when Pingen said it would.",
  ].join("\n"),
  recipient: recipient as Recipient,
});

console.log(`PDF         : ${pdf.length.toLocaleString("en")} bytes`);

try {
  const { pingenId } = await sendLetter({
    pdf,
    recipient: recipient as Recipient,
    // In production this is the letter's row id. Here it only has to be
    // stable across retries of this script.
    idempotencyKey: `week-zero-test-${new Date().toISOString().slice(0, 10)}`,
  });

  console.log("");
  console.log(`SENT. Pingen id: ${pingenId}`);
  console.log("Now wait for the post. Until it lands, the pipeline is unproven.");
} catch (error) {
  console.error("");
  console.error("FAILED. This is what the week-zero test is for.");
  console.error(error);
  process.exit(1);
}
