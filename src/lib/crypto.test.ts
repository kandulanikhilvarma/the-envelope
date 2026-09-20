import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { generateKey, open, seal, secretsMatch } from "./crypto.ts";

const KEY_1 = "3L7tQ0vZq8nH2sXwYdRkFpJbMcNgVuAeTiOlSzKxWq0=";
const KEY_2 = "9aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789AbCdEf=";

function withKeyring(keyring: Record<string, string>, active: string) {
  process.env.LETTER_ENCRYPTION_KEYRING = JSON.stringify(keyring);
  process.env.LETTER_ENCRYPTION_ACTIVE_VERSION = active;
}

afterEach(() => {
  delete process.env.LETTER_ENCRYPTION_KEYRING;
  delete process.env.LETTER_ENCRYPTION_ACTIVE_VERSION;
});

describe("seal/open", () => {
  it("round-trips a letter body", () => {
    withKeyring({ "1": KEY_1 }, "1");
    const plaintext =
      "Happy anniversary. I hope the flat still smells of paint.";

    assert.equal(open(seal(plaintext)), plaintext);
  });

  it("round-trips multi-byte characters", () => {
    withKeyring({ "1": KEY_1 }, "1");
    const plaintext = "Grüße, Liebling — 💌 我爱你";

    assert.equal(open(seal(plaintext)), plaintext);
  });

  it("does not leave the plaintext visible in the ciphertext", () => {
    withKeyring({ "1": KEY_1 }, "1");

    const sealed = seal("the wedding was in Lisbon");
    assert.ok(!sealed.ciphertext.toString("utf8").includes("Lisbon"));
  });

  it("uses a fresh IV each time, so the same text seals differently", () => {
    withKeyring({ "1": KEY_1 }, "1");

    const a = seal("same words");
    const b = seal("same words");
    assert.notEqual(a.iv.toString("base64"), b.iv.toString("base64"));
    assert.notEqual(
      a.ciphertext.toString("base64"),
      b.ciphertext.toString("base64"),
    );
  });

  it("records the active key version on the sealed letter", () => {
    withKeyring({ "1": KEY_1, "2": KEY_2 }, "2");
    assert.equal(seal("x").keyVersion, "2");
  });

  // The whole point of the keyring: a letter sealed years ago under an older
  // version must still open after a rotation.
  it("opens a letter sealed under a retired version after rotation", () => {
    withKeyring({ "1": KEY_1 }, "1");
    const sealed = seal("written before the rotation");

    withKeyring({ "1": KEY_1, "2": KEY_2 }, "2");
    assert.equal(open(sealed), "written before the rotation");
  });

  it("fails loudly when the key version was dropped from the keyring", () => {
    withKeyring({ "1": KEY_1 }, "1");
    const sealed = seal("unrecoverable once key 1 is gone");

    withKeyring({ "2": KEY_2 }, "2");
    assert.throws(() => open(sealed), /No key for version "1"/);
  });

  it("rejects tampered ciphertext rather than returning garbage", () => {
    withKeyring({ "1": KEY_1 }, "1");
    const sealed = seal("post this on the third of June");

    sealed.ciphertext[0] ^= 0xff;
    assert.throws(() => open(sealed));
  });

  it("rejects a key that is not 32 bytes", () => {
    withKeyring({ "1": Buffer.from("too short").toString("base64") }, "1");
    assert.throws(() => seal("x"), /AES-256 needs 32/);
  });

  it("rejects an active version that is not in the keyring", () => {
    withKeyring({ "1": KEY_1 }, "7");
    assert.throws(() => seal("x"), /Active key version "7"/);
  });

  it("refuses to run with no keyring configured", () => {
    assert.throws(() => seal("x"), /LETTER_ENCRYPTION_KEYRING is not set/);
  });
});

describe("generateKey", () => {
  it("produces a usable 32-byte key", () => {
    const key = generateKey();
    assert.equal(Buffer.from(key, "base64").length, 32);

    withKeyring({ "1": key }, "1");
    assert.equal(open(seal("works")), "works");
  });
});

describe("secretsMatch", () => {
  it("accepts an exact match", () => {
    assert.equal(secretsMatch("s3cret", "s3cret"), true);
  });

  it("rejects a mismatch and a length mismatch", () => {
    assert.equal(secretsMatch("s3cret", "s3creT"), false);
    assert.equal(secretsMatch("s3cret", "s3cret-longer"), false);
  });
});
