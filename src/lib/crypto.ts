import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

/**
 * Letter bodies are encrypted at rest and may not be decrypted for up to
 * five years.
 *
 * That is the whole reason this is a keyring rather than a key. Rotation is
 * additive: add a version, point ACTIVE at it, and keep every older version
 * forever. Removing a version silently destroys every letter encrypted under
 * it, and nobody finds out until the day someone expected post.
 */

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // GCM standard nonce length
const TAG_BYTES = 16;
const KEY_BYTES = 32; // AES-256

export type Sealed = {
  /** Ciphertext with the GCM auth tag appended. */
  ciphertext: Buffer;
  iv: Buffer;
  keyVersion: string;
};

function loadKeyring(): Map<string, Buffer> {
  const raw = process.env.LETTER_ENCRYPTION_KEYRING;
  if (!raw) {
    throw new Error("LETTER_ENCRYPTION_KEYRING is not set");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      'LETTER_ENCRYPTION_KEYRING must be JSON of the form {"1":"<base64 32-byte key>"}',
    );
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("LETTER_ENCRYPTION_KEYRING must be a JSON object");
  }

  const keyring = new Map<string, Buffer>();
  for (const [version, encoded] of Object.entries(parsed)) {
    if (typeof encoded !== "string") {
      throw new Error(`Keyring version "${version}" is not a string`);
    }
    const key = Buffer.from(encoded, "base64");
    if (key.length !== KEY_BYTES) {
      throw new Error(
        `Keyring version "${version}" is ${key.length} bytes; AES-256 needs ${KEY_BYTES}`,
      );
    }
    keyring.set(version, key);
  }

  if (keyring.size === 0) {
    throw new Error("LETTER_ENCRYPTION_KEYRING is empty");
  }
  return keyring;
}

function activeVersion(keyring: Map<string, Buffer>): string {
  const version = process.env.LETTER_ENCRYPTION_ACTIVE_VERSION;
  if (!version) {
    throw new Error("LETTER_ENCRYPTION_ACTIVE_VERSION is not set");
  }
  if (!keyring.has(version)) {
    throw new Error(
      `Active key version "${version}" is not present in the keyring`,
    );
  }
  return version;
}

/** Encrypts a letter body under the currently active key version. */
export function seal(plaintext: string): Sealed {
  const keyring = loadKeyring();
  const keyVersion = activeVersion(keyring);
  const key = keyring.get(keyVersion)!;

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const body = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  return {
    ciphertext: Buffer.concat([body, cipher.getAuthTag()]),
    iv,
    keyVersion,
  };
}

/**
 * Decrypts a letter body using the version it was sealed under.
 *
 * Throws rather than returning a partial result: a letter we cannot open is
 * an incident, not an empty string to be quietly printed and posted.
 */
export function open({ ciphertext, iv, keyVersion }: Sealed): string {
  const keyring = loadKeyring();
  const key = keyring.get(keyVersion);
  if (!key) {
    throw new Error(
      `No key for version "${keyVersion}". It was removed from the keyring; ` +
        "letters sealed under it cannot be recovered. Restore it from escrow.",
    );
  }
  if (ciphertext.length < TAG_BYTES) {
    throw new Error("Ciphertext is too short to contain a GCM auth tag");
  }

  const body = ciphertext.subarray(0, ciphertext.length - TAG_BYTES);
  const tag = ciphertext.subarray(ciphertext.length - TAG_BYTES);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString(
    "utf8",
  );
}

/** Constant-time compare, for shared secrets such as CRON_SECRET. */
export function secretsMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Generates a fresh base64 key. Used when adding a keyring version. */
export function generateKey(): string {
  return randomBytes(KEY_BYTES).toString("base64");
}
