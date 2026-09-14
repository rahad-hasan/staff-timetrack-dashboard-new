import { loadStripe, type Stripe } from "@stripe/stripe-js";

/**
 * The browser Stripe.js singleton.
 *
 * `loadStripe` injects a `<script>` and resolves once it has run. Calling it
 * inside a component would re-request Stripe.js on every render and hand
 * `<Elements>` a new promise each time, which remounts the payment iframes and
 * throws away whatever the user had typed. Module scope is what makes it
 * exactly one load per page.
 *
 * Deliberately lazy: the module is imported by the billing bundle, but the
 * script itself is only fetched the first time a surface actually asks for it,
 * so a settings page that never shows a card field pays nothing.
 */
let stripePromise: Promise<Stripe | null> | null = null;

/** Publishable key — safe to ship to the browser; the secret key never leaves the API. */
export const STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export const isStripeConfigured = (): boolean =>
  STRIPE_PUBLISHABLE_KEY.startsWith("pk_");

export const getStripe = (): Promise<Stripe | null> => {
  if (!isStripeConfigured()) {
    // Returning a resolved null keeps every caller on one code path: the
    // Elements provider renders its "payments unavailable" state instead of
    // each surface having to guard the env var itself.
    return Promise.resolve(null);
  }

  // `loadStripe` REJECTS when js.stripe.com cannot be fetched — an ad blocker,
  // a strict corporate proxy, an offline moment. An unhandled rejection there
  // leaves `<Elements>` mounted with no Stripe instance, so the card fields
  // never appear and the pay button never enables, with nothing on screen
  // saying why. Collapsing the failure to `null` puts it on the same code path
  // as a missing key, which every caller already renders an explanation for.
  stripePromise ??= loadStripe(STRIPE_PUBLISHABLE_KEY).catch(() => null);
  return stripePromise;
};
