import { optionalEnv, requireEnv } from "./env.ts";
import type { Recipient } from "./letters.ts";

/**
 * Pingen print-and-mail client.
 *
 * Sending is a three-step dance: get a token, ask for a signed upload slot,
 * PUT the PDF there, then create the letter referencing that slot.
 *
 * UNVERIFIED AGAINST A LIVE ACCOUNT. The shapes here follow Pingen's v2 API
 * but no request in this file has been run against the real service. The
 * week-zero live test letter is what promotes this from "probably right" to
 * "known good", do not take real money before that has happened.
 */

const TOKEN_URL = "https://identity.pingen.com/auth/access-tokens";

function apiBase(): string {
  return optionalEnv(
    "PINGEN_API_BASE",
    "https://api-staging.pingen.com",
  ).replace(/\/$/, "");
}

export class PingenError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: string,
  ) {
    super(message);
    this.name = "PingenError";
  }
}

async function readError(response: Response, step: string): Promise<never> {
  // Bounded: an error body is for a human, and Pingen can return HTML.
  const body = (await response.text().catch(() => "")).slice(0, 2000);
  throw new PingenError(
    `Pingen ${step} failed with ${response.status}`,
    response.status,
    body,
  );
}

let token: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  // 60s of slack so a token cannot expire mid-request.
  if (token && Date.now() < token.expiresAt - 60_000) return token.value;

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      client_id: requireEnv("PINGEN_CLIENT_ID"),
      client_secret: requireEnv("PINGEN_CLIENT_SECRET"),
    }),
  });
  if (!response.ok) await readError(response, "authentication");

  const json = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };
  token = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return token.value;
}

type UploadSlot = { url: string; signature: string };

async function requestUploadSlot(bearer: string): Promise<UploadSlot> {
  const response = await fetch(`${apiBase()}/file-upload`, {
    headers: { Authorization: `Bearer ${bearer}` },
  });
  if (!response.ok) await readError(response, "file-upload request");

  const json = (await response.json()) as {
    data: { attributes: { url: string; url_signature: string } };
  };
  return {
    url: json.data.attributes.url,
    signature: json.data.attributes.url_signature,
  };
}

async function putPdf(slot: UploadSlot, pdf: Buffer): Promise<void> {
  const response = await fetch(slot.url, {
    method: "PUT",
    headers: { "Content-Type": "application/pdf" },
    body: new Uint8Array(pdf),
  });
  if (!response.ok) await readError(response, "PDF upload");
}

export type SendResult = { pingenId: string };

/**
 * Creates one letter. `idempotencyKey` is the letter's own id, so a retry of
 * a request whose response we never saw cannot produce a second posting.
 */
export async function sendLetter(opts: {
  pdf: Buffer;
  recipient: Recipient;
  idempotencyKey: string;
}): Promise<SendResult> {
  const bearer = await accessToken();
  const slot = await requestUploadSlot(bearer);
  await putPdf(slot, opts.pdf);

  const organisation = requireEnv("PINGEN_ORGANISATION_ID");
  const response = await fetch(
    `${apiBase()}/organisations/${organisation}/letters`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bearer}`,
        "Content-Type": "application/vnd.api+json",
        "Idempotency-Key": opts.idempotencyKey,
      },
      body: JSON.stringify({
        data: {
          type: "letters",
          attributes: {
            file_original_name: `letter-${opts.idempotencyKey}.pdf`,
            file_url: slot.url,
            file_url_signature: slot.signature,
            address_position: "left",
            auto_send: true,
            delivery_product: "fast",
            print_mode: "simplex",
            print_spectrum: "color",
          },
        },
      }),
    },
  );
  if (!response.ok) await readError(response, "letters.create");

  const json = (await response.json()) as { data: { id: string } };
  return { pingenId: json.data.id };
}
