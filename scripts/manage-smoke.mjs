/**
 * Browser regression check against an isolated in-memory Supabase fixture.
 * No live database, payments, email or print provider is contacted.
 * Requires Playwright with Chromium. PLAYWRIGHT_MODULE_PATH may point to a
 * bundled installation; otherwise the usual local package resolution is used.
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");
const root = process.cwd();
const output = path.join(root, "browser-proof");
const TOKEN = "6f9619ff-8b86-d011-b42d-00c04fc964ff";
const ORDER_ID = "11111111-1111-4111-8111-111111111111";
const rows = [
  {
    id: "22222222-2222-4222-8222-222222222222", order_id: ORDER_ID,
    deliver_on: "2027-10-02", status: "scheduled", sent_at: null,
    recipient: { name: "Ana Meyer", line1: "Hauptstrasse 4", postcode: "10115", city: "Berlin", country: "DE" },
  },
  {
    id: "33333333-3333-4333-8333-333333333333", order_id: ORDER_ID,
    deliver_on: "2027-10-02", status: "sent", sent_at: "2027-10-02T06:00:00Z",
    recipient: { name: "Sam Meyer", line1: "Torstrasse 10", line2: "Apartment 2", postcode: "10119", city: "Berlin", country: "DE" },
  },
];
const requests = [];
const fixture = createServer(async (request, response) => {
  const url = new URL(request.url, "http://fixture.invalid");
  let body = "";
  for await (const chunk of request) body += chunk;
  requests.push({ path: url.pathname, query: url.searchParams, method: request.method });
  const reply = (data, status = 200) => {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify(data));
  };
  if (url.pathname === "/rest/v1/rpc/consume_rate_limit") return reply(true);
  if (url.pathname === "/rest/v1/orders") {
    return reply(url.searchParams.get("cancel_token") === `eq.${TOKEN}`
      ? [{ id: ORDER_ID, sku: "pair", status: "paid" }] : []);
  }
  if (url.pathname === "/rest/v1/letters") {
    const selected = rows.filter((row) =>
      url.searchParams.get("order_id") === `eq.${row.order_id}` &&
      (!url.searchParams.has("id") || url.searchParams.get("id") === `eq.${row.id}`) &&
      (!url.searchParams.has("status") || url.searchParams.get("status").slice(4, -1).split(",").includes(row.status)),
    );
    if (request.method === "PATCH") {
      const update = JSON.parse(body);
      assert.deepEqual(Object.keys(update), ["recipient"]);
      for (const row of selected) row.recipient = update.recipient;
    }
    return reply(selected);
  }
  return reply({ message: "Unexpected fixture request" }, 400);
});

await new Promise((resolve) => fixture.listen(0, "127.0.0.1", resolve));
const fixturePort = fixture.address().port;
const probe = createServer();
await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
const appPort = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const base = `http://127.0.0.1:${appPort}`;
let logs = "";
const next = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "dev", "--hostname", "127.0.0.1", "--port", String(appPort)], {
  cwd: root, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
    NEXT_PUBLIC_SITE_URL: base,
    NEXT_PUBLIC_SUPABASE_URL: `http://127.0.0.1:${fixturePort}`,
    SUPABASE_SERVICE_ROLE_KEY: "fixture-service-role",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "fixture-anon",
    STRIPE_SECRET_KEY: "sk_test_fixture",
    STRIPE_WEBHOOK_SECRET: "whsec_fixture",
    RESEND_API_KEY: "",
    PINGEN_CLIENT_ID: "fixture",
    PINGEN_CLIENT_SECRET: "fixture",
    PINGEN_ORGANISATION_ID: "fixture",
  },
});
for (const stream of [next.stdout, next.stderr]) stream.on("data", (chunk) => { logs = (logs + chunk).slice(-6000); });
let browser;
async function screenshot(page, name) {
  // Dev UI and focus-induced scrolling are not part of the shipped surface.
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(output, name), fullPage: true });
}

async function checkPlaceholderContrast(page) {
  const ratio = await page.getByLabel("Your private reference").evaluate((input) => {
    const luminance = (color) => {
      const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number).map((channel) => {
        const value = channel / 255;
        return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      });
      return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    };
    const text = luminance(getComputedStyle(input, "::placeholder").color);
    const background = luminance(getComputedStyle(input).backgroundColor);
    return (Math.max(text, background) + 0.05) / (Math.min(text, background) + 0.05);
  });
  assert.ok(ratio >= 4.5, `reference placeholder contrast: ${ratio.toFixed(2)}:1`);
}

try {
  await mkdir(output, { recursive: true });
  const deadline = Date.now() + 90_000;
  while (true) {
    if (next.exitCode !== null) throw new Error(`Next exited: ${logs}`);
    try { if ((await fetch(`${base}/manage`)).ok) break; } catch { /* Starting. */ }
    if (Date.now() > deadline) throw new Error(`Next did not become ready: ${logs}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || undefined });
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" });
  const page = await desktop.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/manage`);
  await page.getByRole("heading", { name: "Life moves. Your letter follows." }).waitFor();
  await screenshot(page, "manage-entry-desktop.png");
  await checkPlaceholderContrast(page);
  assert.ok((await page.locator('meta[name="robots"]').getAttribute("content")).includes("noindex"));

  const reference = page.getByLabel("Your private reference");
  await reference.fill("not-a-reference");
  await page.getByRole("button", { name: "Find my letter" }).click();
  await page.getByRole("alert").waitFor();
  assert.equal(await reference.inputValue(), "not-a-reference");
  assert.equal(await page.locator(":focus").getAttribute("name"), "token");
  await reference.fill(TOKEN);
  await page.getByRole("button", { name: "Find my letter" }).click();
  await page.getByRole("heading", { name: "Your two sealed letters" }).waitFor();
  assert.equal(await page.locator("article").count(), 2);
  assert.equal(await page.getByRole("button", { name: "Update this address" }).count(), 1);
  await screenshot(page, "manage-records-desktop.png");

  await page.getByRole("button", { name: "Update this address" }).click();
  await page.getByLabel("Town or city", { exact: true }).fill("Hamburg");
  await page.getByLabel("Postcode", { exact: true }).fill("20095");
  await page.getByRole("button", { name: "Save new address" }).click();
  await page.getByRole("status").filter({ hasText: "New address saved" }).waitFor();
  assert.equal(rows[0].recipient.city, "Hamburg");
  assert.equal(rows[1].recipient.city, "Berlin");
  await page.getByRole("button", { name: "Refresh status" }).click();
  await page.getByRole("heading", { name: "Your two sealed letters" }).waitFor();
  assert.ok((await page.locator("article").first().innerText()).includes("Hamburg"));

  // Lose a printing race after opening the editor. The server must reject
  // the write even though the client still shows a scheduled letter.
  await page.getByRole("button", { name: "Update this address" }).click();
  await page.getByLabel("Town or city", { exact: true }).fill("Munich");
  rows[0].status = "sending";
  await page.getByRole("button", { name: "Save new address" }).click();
  await page.getByRole("alert").filter({ hasText: "could not be changed" }).waitFor();
  assert.equal(rows[0].recipient.city, "Hamburg");
  assert.equal(await page.getByRole("button", { name: "Save new address" }).isDisabled(), true);
  await page.getByRole("button", { name: "Close and refresh status" }).click();
  await page.getByText("Preparing for post", { exact: true }).waitFor();
  assert.equal(await page.getByRole("button", { name: "Update this address" }).count(), 0);
  assert.equal(await page.locator(":focus").innerText(), "Your two sealed letters");
  await screenshot(page, "manage-printing-race-recovered.png");

  await page.getByRole("button", { name: "Hide details & use another reference" }).click();
  assert.equal(await page.locator("article").count(), 0);
  assert.equal(await reference.inputValue(), "");
  assert.equal(await page.evaluate(() => Object.keys(sessionStorage).length + Object.keys(localStorage).length), 0);
  assert.ok(!page.url().includes(TOKEN));
  await page.reload();
  assert.equal(await page.locator("article").count(), 0);

  rows[0].status = "scheduled";
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "light", isMobile: true, hasTouch: true });
  const phone = await mobile.newPage();
  await phone.goto(`${base}/manage`);
  await phone.getByLabel("Your private reference").fill(TOKEN);
  await phone.getByRole("button", { name: "Find my letter" }).click();
  await phone.getByRole("heading", { name: "Your two sealed letters" }).waitFor();
  await screenshot(phone, "manage-records-mobile.png");
  await phone.locator("article").first().screenshot({ path: path.join(output, "manage-record-mobile-detail.png") });
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await phone.getByRole("button", { name: "Update this address" }).click();
  await screenshot(phone, "manage-editor-mobile.png");
  await phone.locator("article").first().screenshot({ path: path.join(output, "manage-editor-mobile-detail.png") });
  assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mobile.close();

  const dark = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "dark", reducedMotion: "reduce" });
  const darkPage = await dark.newPage();
  await darkPage.goto(`${base}/manage`);
  await checkPlaceholderContrast(darkPage);
  await darkPage.getByLabel("Your private reference").fill(TOKEN);
  await darkPage.getByRole("button", { name: "Find my letter" }).click();
  await darkPage.getByRole("heading", { name: "Your two sealed letters" }).waitFor();
  await screenshot(darkPage, "manage-records-dark.png");
  await dark.close();

  // Reusing the address component must preserve the existing compose flow.
  await page.goto(`${base}/write?sku=pair`);
  await page.getByRole("heading", { name: "Write your letters", exact: true }).waitFor();
  await page.getByLabel("Recipient’s name", { exact: true }).fill("Test Recipient");
  await page.getByText("Post the second letter to the same address.", { exact: true }).click();
  assert.equal(await page.getByLabel("Recipient’s name", { exact: true }).count(), 2);
  assert.equal(new Set(await page.locator("[id]").evaluateAll((elements) => elements.map((element) => element.id))).size, await page.locator("[id]").count());
  assert.deepEqual(errors, []);
  for (const request of requests.filter((entry) => entry.path === "/rest/v1/letters")) {
    assert.ok(!request.query.get("select").includes("content_"));
  }
  console.log("PASS: lookup, pair isolation, update, refresh, printing race, privacy, mobile, dark theme and compose regression.");
  console.log(`Screenshots: ${output}`);
} finally {
  await browser?.close();
  next.kill();
  await new Promise((resolve) => fixture.close(resolve));
}
