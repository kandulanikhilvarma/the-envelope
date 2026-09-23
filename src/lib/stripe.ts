import Stripe from "stripe";
import { requireEnv, siteUrl } from "./env.ts";
import { breakdown, SKUS, type Sku } from "./pricing.ts";

let cached: Stripe | null = null;

export function stripe(): Stripe {
  if (!cached) {
    cached = new Stripe(requireEnv("STRIPE_SECRET_KEY"));
  }
  return cached;
}

/**
 * Creates the hosted Checkout session for one order.
 *
 * The letters are already in the database in 'pending_payment', a letter
 * body is far larger than Stripe's 500-character metadata limit, so only the
 * order id travels with the session. The order, not the letter, because the
 * pair SKU produces two letters and both have to be promoted by one webhook.
 */
export async function createCheckoutSession(opts: {
  sku: Sku;
  orderId: string;
}): Promise<Stripe.Checkout.Session> {
  const { grossCents } = breakdown(opts.sku);

  return stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: grossCents,
          // Gross prices: German VAT is inclusive, not added at checkout.
          tax_behavior: "inclusive",
          product_data: {
            name: "The Envelope",
            description: SKUS[opts.sku].label,
          },
        },
      },
    ],
    metadata: { order_id: opts.orderId, sku: opts.sku },
    success_url: `${siteUrl()}/written?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/write?cancelled=1`,
  });
}

/**
 * Verifies the webhook signature against the raw request body.
 *
 * Must be the raw text, not a re-serialised object: re-encoding changes the
 * bytes and the signature no longer matches.
 */
export function parseWebhookEvent(
  rawBody: string,
  signature: string,
): Stripe.Event {
  return stripe().webhooks.constructEvent(
    rawBody,
    signature,
    requireEnv("STRIPE_WEBHOOK_SECRET"),
  );
}

export async function refund(paymentIntentId: string): Promise<void> {
  await stripe().refunds.create({ payment_intent: paymentIntentId });
}

/**
 * Events this webhook acts on. Anything else is acknowledged and ignored,
 * Stripe sends a great deal more than a product this small needs.
 */
export const HANDLED_EVENTS = [
  "checkout.session.completed",
  "checkout.session.expired",
  "charge.refunded",
] as const;
