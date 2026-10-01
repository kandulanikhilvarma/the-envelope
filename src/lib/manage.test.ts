import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { loadManagedOrder, updateManagedAddress } from "./manage.ts";
import { canEditAddress } from "./management.ts";

const TOKEN = "6f9619ff-8b86-d011-b42d-00c04fc964ff";
const ORDER_ID = "11111111-1111-4111-8111-111111111111";
const LETTER_ID = "22222222-2222-4222-8222-222222222222";
const recipient = {
  name: "Ana Meyer", line1: "Hauptstrasse 4", postcode: "10115", city: "Berlin", country: "DE",
};
const order = { id: ORDER_ID, sku: "single", status: "paid" };
const letter = { id: LETTER_ID, deliver_on: "2027-06-01", status: "scheduled", sent_at: null, recipient };

/** Exercise the real Supabase query builder at its HTTP boundary. */
function transport(replies: unknown[]) {
  const requests: { url: URL; method: string; body?: unknown }[] = [];
  const client = createClient("https://database.example.invalid", "test-service-role", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: async (input, init) => {
        const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
        requests.push({ url, method: init?.method ?? "GET", body: init?.body ? JSON.parse(String(init.body)) : undefined });
        assert.ok(replies.length, "unexpected database request");
        const reply = replies.shift();
        if (reply === "database-error") return Response.json({ message: "internal row information" }, { status: 400 });
        return Response.json(reply);
      },
    },
  });
  return { client, requests };
}

describe("private letter management", () => {
  it("gives malformed and unknown references the same answer", async () => {
    const invalid = transport([]);
    const missing = transport([[]]);
    assert.deepEqual(await loadManagedOrder("not-a-token", invalid.client), await loadManagedOrder(TOKEN, missing.client));
    assert.equal(invalid.requests.length, 0);
  });

  it("loads both letters while selecting only delivery metadata", async () => {
    const second = { ...letter, id: "33333333-3333-4333-8333-333333333333", recipient: { ...recipient, name: "Sam Meyer" } };
    const { client, requests } = transport([[{ ...order, sku: "pair" }], [letter, second]]);
    const result = await loadManagedOrder(` ${TOKEN} `, client);
    assert.ok("order" in result);
    assert.equal(result.order.letters.length, 2);
    assert.equal(result.order.letters[1].recipient.name, "Sam Meyer");
    assert.equal(requests[0].url.searchParams.get("cancel_token"), `eq.${TOKEN}`);
    assert.equal(requests[1].url.searchParams.get("order_id"), `eq.${ORDER_ID}`);
    assert.equal(requests[1].url.searchParams.get("select"), "id,deliver_on,status,sent_at,recipient");
    assert.ok(!JSON.stringify(result).includes("content_ciphertext"));
  });

  it("does not treat database failures as an unknown reference", async () => {
    const first = transport(["database-error"]);
    const second = transport([[order], "database-error"]);
    await assert.rejects(loadManagedOrder(TOKEN, first.client), /^Error: Management lookup failed$/);
    await assert.rejects(loadManagedOrder(TOKEN, second.client), /^Error: Delivery lookup failed$/);
  });

  it("validates the address before making any database request", async () => {
    const { client, requests } = transport([]);
    const result = await updateManagedAddress(TOKEN, LETTER_ID, { ...recipient, city: " " }, client);
    assert.equal(result.field, "city");
    assert.equal(requests.length, 0);
  });

  it("authorizes the reference again for an address update", async () => {
    const { client, requests } = transport([[]]);
    const result = await updateManagedAddress(TOKEN, LETTER_ID, recipient, client);
    assert.ok(result.error);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url.searchParams.get("cancel_token"), `eq.${TOKEN}`);
  });

  it("does not change addresses on unpaid or refunded orders", async () => {
    for (const status of ["pending", "refunded"]) {
      const { client, requests } = transport([[{ ...order, status }]]);
      const result = await updateManagedAddress(TOKEN, LETTER_ID, recipient, client);
      assert.equal(result.locked, true);
      assert.equal(requests.length, 1);
    }
  });

  it("changes only the chosen letter's address and preserves fulfilment state", async () => {
    const next = { ...recipient, city: " Hamburg ", postcode: "20095", line2: " " };
    const { client, requests } = transport([[order], [{ ...letter, recipient: { ...recipient, city: "Hamburg", postcode: "20095" } }]]);
    const result = await updateManagedAddress(TOKEN, LETTER_ID, next, client);
    assert.equal(result.letter?.recipient.city, "Hamburg");
    const update = requests[1];
    assert.equal(update.method, "PATCH");
    assert.equal(update.url.searchParams.get("id"), `eq.${LETTER_ID}`);
    assert.equal(update.url.searchParams.get("order_id"), `eq.${ORDER_ID}`);
    assert.equal(update.url.searchParams.get("status"), "in.(scheduled,retry,failed)");
    assert.deepEqual(update.body, { recipient: { ...recipient, postcode: "20095", city: "Hamburg" } });
  });

  it("reports a lost dispatch race or an unowned letter without claiming success", async () => {
    const { client } = transport([[order], []]);
    const result = await updateManagedAddress(TOKEN, LETTER_ID, recipient, client);
    assert.equal(result.locked, true);
    assert.ok(result.error);
    assert.equal(result.letter, undefined);
  });

  it("does not claim success when the database rejects the update", async () => {
    const { client } = transport([[order], "database-error"]);
    await assert.rejects(updateManagedAddress(TOKEN, LETTER_ID, recipient, client), /^Error: Address update failed$/);
  });

  it("never offers address editing once printing begins or content is erased", () => {
    for (const status of ["sending", "sent", "withdrawn", "pending_payment"] as const) assert.equal(canEditAddress(status), false);
    for (const status of ["scheduled", "retry", "failed"] as const) assert.equal(canEditAddress(status), true);
  });
});
