"use client";

import { useCallback, useRef, useState } from "react";
import { useElements, useStripe } from "@stripe/react-stripe-js";

import { confirmSubscription, subscribeToPlan } from "@/actions/billing/action";
import {
  mapPaymentFailure,
  mapRequestFailure,
  type PaymentFailureCopy,
} from "@/lib/billing";
import type { BillingCycle } from "@/types/billing";

export type CheckoutPhase =
  | "idle"
  /** Creating (or reusing) the subscription and confirming the card. */
  | "submitting"
  /** Stripe is showing a 3-D Secure challenge. */
  | "authenticating"
  | "succeeded"
  | "failed";

export interface CheckoutSubmitInput {
  /** A saved `pm_…`. Omit to confirm with whatever is typed in the Element. */
  paymentMethodId?: string;
  savePaymentMethod: boolean;
  /** Our own inputs — not PCI-sensitive, so they may cross the wire to Stripe. */
  billingName?: string;
  billingCountry?: string;
}

interface UseCheckoutPaymentOptions {
  planId: number;
  cycle: BillingCycle;
  seats: number;
  discountCode?: string;
  /** Called once the subscription is live. Receives the Stripe subscription id. */
  onSucceeded: (subscriptionId: string) => void;
}

/**
 * The checkout state machine.
 *
 * The whole design hinges on one property: **a decline must be retryable in
 * place**. That is why the purchase runs on `payment_behavior:
 * "default_incomplete"` rather than a Checkout Session — a declined
 * subscription stays `incomplete` with its invoice open and the SAME
 * PaymentIntent still confirmable, so "Try Payment Again" is a second confirm
 * of one intent rather than a second purchase.
 *
 * Getting that wrong is expensive in both directions: calling `subscribe`
 * again on retry can mint a second Stripe subscription (double billing), and
 * the server's stale-subscription guard answers 409 for the rest of the
 * session once it does. So the client secret earned by the first attempt is
 * held in a ref and reused by every retry until it actually succeeds.
 *
 * Deferred-intent order is also load-bearing:
 *   elements.submit()  →  create the subscription  →  stripe.confirmPayment()
 * Validating the card fields BEFORE the server call means a typo never creates
 * a subscription, and it is what lets the Elements group stay mounted for the
 * whole page instead of remounting (and wiping the card) when the intent
 * arrives.
 */
export const useCheckoutPayment = ({
  planId,
  cycle,
  seats,
  discountCode,
  onSucceeded,
}: UseCheckoutPaymentOptions) => {
  const stripe = useStripe();
  const elements = useElements();

  const [phase, setPhase] = useState<CheckoutPhase>("idle");
  const [failure, setFailure] = useState<PaymentFailureCopy | null>(null);

  /**
   * The in-flight attempt, survived across retries.
   *
   * Cleared only on success or when the order itself changes (a different
   * plan/cycle/seat count is a different purchase and must not reuse the old
   * intent). `clearPending` is what the order panel calls on a re-quote.
   */
  const pending = useRef<{ subscriptionId: string; clientSecret: string } | null>(
    null,
  );

  const clearPending = useCallback(() => {
    pending.current = null;
  }, []);

  const dismissFailure = useCallback(() => setFailure(null), []);

  const fail = useCallback((copy: PaymentFailureCopy) => {
    setFailure(copy);
    setPhase("failed");
  }, []);

  /**
   * Activation is deliberately separate from confirmation: Stripe reporting
   * `succeeded` only means the money moved, and our own row is not updated
   * until the backend re-reads the subscription. Doing it here rather than
   * waiting for the webhook is what makes activation work in local dev and
   * survive a dropped webhook in production.
   */
  const activate = useCallback(
    async (subscriptionId: string) => {
      const res = await confirmSubscription(subscriptionId);

      if (!res?.success) {
        // The charge went through — refusing to move on would leave a paying
        // customer staring at a failure. Hand them to the success screen,
        // which re-confirms and can report a genuine problem with full context.
        console.warn("Subscription confirm failed after payment", res?.message);
      }

      pending.current = null;
      setPhase("succeeded");
      onSucceeded(subscriptionId);
    },
    [onSucceeded],
  );

  const submit = useCallback(
    async (input: CheckoutSubmitInput) => {
      if (!stripe || !elements) {
        fail(
          mapRequestFailure(
            "The payment form is still loading. Please try again in a moment.",
          ),
        );
        return;
      }

      setFailure(null);
      setPhase("submitting");

      const usingSavedCard = Boolean(input.paymentMethodId);

      try {
        // Validate the card fields before anything is created server-side. Skipped
        // for a saved card — there is no mounted Element to validate.
        if (!usingSavedCard) {
          const { error: submitError } = await elements.submit();
          if (submitError) {
            fail(
              mapPaymentFailure(
                submitError.code,
                submitError.decline_code,
                submitError.message,
              ),
            );
            return;
          }
        }

        // Reuse the intent from a previous declined attempt. Requesting a new
        // subscription here is the double-billing bug this whole ref exists to
        // prevent.
        let subscriptionId = pending.current?.subscriptionId ?? null;
        let clientSecret = pending.current?.clientSecret ?? null;

        if (!clientSecret) {
          const res = await subscribeToPlan({
            plan_id: planId,
            seats,
            cycle,
            ...(discountCode ? { discount_code: discountCode } : {}),
            ...(input.paymentMethodId
              ? { payment_method_id: input.paymentMethodId }
              : {}),
            save_payment_method: input.savePaymentMethod,
          });

          if (!res?.success || !res.data) {
            fail(
              mapRequestFailure(
                res?.message || "We could not start this payment. Please try again.",
              ),
            );
            return;
          }

          const data = res.data;

          // A saved card often clears on the server in one hop, and a switch
          // between paid plans is settled by proration with nothing to confirm.
          if (data.already_active || !data.payment_intent_client_secret) {
            await activate(data.subscription_id);
            return;
          }

          subscriptionId = data.subscription_id;
          clientSecret = data.payment_intent_client_secret;
          pending.current = { subscriptionId, clientSecret };

          // NOTE: there was a saved-card "fast fail" here, guarded on
          // `usingSavedCard && data.requires_payment_method &&
          // !input.paymentMethodId`. `usingSavedCard` IS
          // `Boolean(input.paymentMethodId)`, so the last two conjuncts were
          // mutually exclusive and the block could never run. Its premise was
          // wrong too: `default_incomplete` does not charge at creation, so a
          // `requires_payment_method` intent here is not a final decline.
          // Removed rather than "repaired" — every saved-card outcome belongs
          // on the single `confirmPayment({clientSecret, payment_method})`
          // path below, which is also what makes retrying THIS intent work.
        }

        setPhase(usingSavedCard ? "submitting" : "authenticating");

        /**
         * Where a redirect-based bank challenge returns to.
         *
         * The subscription id MUST be on it. Stripe appends only its own
         * `payment_intent` / `redirect_status` params, so a bare URL lands the
         * user on a success page with no reference to confirm — which reports
         * "we couldn't find your checkout" to someone who has just been charged.
         */
        const returnUrl = `${window.location.origin}/billing/success?subscription_id=${encodeURIComponent(
          subscriptionId!,
        )}`;

        const confirmation = usingSavedCard
          ? // A saved card still has to be CONFIRMED, not merely advanced.
            // `payment_behavior: "default_incomplete"` deliberately does not
            // charge on creation even when a default_payment_method is
            // attached — it leaves the intent in requires_confirmation for the
            // client. `handleNextAction` only advances an intent that is
            // already requires_action, so using it here silently no-ops and
            // the purchase never takes any money.
            //
            // Naming the payment method explicitly is also what makes retry
            // after a decline work: re-confirming this same intent with a
            // DIFFERENT card is exactly the "Change Payment Method" path.
            await stripe.confirmPayment({
              clientSecret,
              confirmParams: {
                payment_method: input.paymentMethodId,
                return_url: returnUrl,
              },
              redirect: "if_required",
            })
          : await stripe.confirmPayment({
              elements,
              clientSecret,
              confirmParams: {
                return_url: returnUrl,
                payment_method_data: {
                  billing_details: {
                    ...(input.billingName ? { name: input.billingName } : {}),
                    ...(input.billingCountry
                      ? { address: { country: input.billingCountry } }
                      : {}),
                  },
                },
              },
              // Keeps the user on our page for everything that does not strictly
              // require a redirect; only a bank that insists on a full-page
              // handoff will navigate away, and it returns to /billing/success.
              redirect: "if_required",
            });

        if (confirmation.error) {
          fail(
            mapPaymentFailure(
              confirmation.error.code,
              confirmation.error.decline_code,
              confirmation.error.message,
            ),
          );
          return;
        }

        const intent = confirmation.paymentIntent;

        // `processing` is a success from the buyer's point of view — the money is
        // committed and the webhook finalises it. Blocking here would strand them.
        if (
          intent &&
          (intent.status === "succeeded" || intent.status === "processing")
        ) {
          await activate(subscriptionId!);
          return;
        }

        if (intent && intent.status === "requires_payment_method") {
          fail(
            mapPaymentFailure(
              "card_declined",
              null,
              "Your bank declined this payment. Please check your card details or try another payment method",
            ),
          );
          return;
        }

        // Anything else (requires_action after a handoff, an unexpected status)
        // is not a failure we can describe honestly — re-read from the server,
        // which is the authority on whether the subscription is live.
        await activate(subscriptionId!);
      } catch (error) {
        fail(
          mapRequestFailure(
            error instanceof Error
              ? error.message
              : "Something went wrong completing your payment.",
          ),
        );
      }
    },
    [stripe, elements, planId, seats, cycle, discountCode, activate, fail],
  );

  return {
    phase,
    failure,
    submit,
    dismissFailure,
    clearPending,
    /** True once an attempt has been made — the CTA becomes "Try Payment Again". */
    hasAttempted: phase === "failed",
    busy: phase === "submitting" || phase === "authenticating",
    ready: Boolean(stripe && elements),
  };
};
