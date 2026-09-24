"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, ExternalLink, Loader2, XCircle } from "lucide-react";

import {
  confirmCheckout,
  confirmSubscription,
  getBillingStatus,
} from "@/actions/billing/action";
import { BILLING_URL } from "@/lib/billing";
import { storeVerifiedSubscriptionTransition } from "@/lib/verifiedSubscriptionTransition";
import { Button } from "@/components/ui/button";
import SuccessCelebration from "./SuccessCelebration";

const POLL_INTERVAL_MS = 4000;
const TIMEOUT_MS = 90_000;
/** Re-attempt server-side confirm every Nth poll (~12s) until it concludes. */
const CONFIRM_EVERY_N_POLLS = 3;

/**
 * Where the failed state sends the user to try again.
 *
 * NOT `/billing/checkout`: that page needs a `?plan=` to price an order and
 * redirects away without one, and no plan/cycle/seat param survives the return
 * trip from Stripe. Landing them on the plan grid instead is the honest
 * equivalent — one click from the same purchase, and it cannot dead-end.
 */
const RETRY_URL = `${BILLING_URL}?tab=my-plan#plans`;

type Phase = "verifying" | "active" | "failed" | "timeout";

interface FailureCopy {
  title: string;
  description: string;
}

const FAILURE_COPY = {
  missing_reference: {
    title: "We couldn't find your checkout",
    description:
      "This link is missing its checkout reference, so there is nothing to confirm. Start the checkout again — you will not be charged twice.",
  },
  expired: {
    title: "Your checkout session expired",
    description:
      "Nothing was charged. Sessions time out after a while, so start the checkout again to finish subscribing.",
  },
  unpaid: {
    title: "Payment didn't go through",
    description:
      "Your card was not charged, so the plan was not activated. Try again — a different card usually clears it.",
  },
  needs_card: {
    title: "We need another payment method",
    description:
      "Your card was declined, so the subscription is still incomplete. Try the checkout again with a different card.",
  },
  past_due: {
    title: "Payment couldn't be completed",
    description:
      "The first invoice for this subscription is still unpaid, so your plan has not started. Retry the payment to activate it.",
  },
  canceled: {
    title: "This subscription was canceled",
    description:
      "It was never activated and nothing is being billed. Start the checkout again whenever you're ready.",
  },
  rejected: {
    title: "We couldn't confirm this purchase",
    description:
      "The checkout reference was rejected — it may belong to another workspace or have already been used. Start the checkout again.",
  },
} as const satisfies Record<string, FailureCopy>;

type FailureReason = keyof typeof FAILURE_COPY;

/**
 * Stripe subscription statuses that mean "this purchase is not coming back".
 * `trialing` is deliberately ABSENT — a checkout that lands the company in a
 * trial (reverse trial preserved, or a trial-first plan) is a SUCCESSFUL
 * purchase, and the old code treating only `active` as success is exactly why
 * those users sat on a spinner for 90s.
 */
const DEAD_SUBSCRIPTION_STATUS: Record<string, FailureReason> = {
  past_due: "past_due",
  payment_failed: "past_due",
  unpaid: "past_due",
  canceled: "canceled",
  incomplete_expired: "expired",
};

const isSuccessStatus = (status: string | null | undefined): boolean =>
  status === "active" || status === "trialing";

/**
 * Client for the standalone /billing/success page (rendered OUTSIDE the main
 * layout — no billing store here). Two entry shapes land here and exactly one
 * of them is present:
 *
 *  - `?session_id=cs_…`      the Stripe-hosted Checkout Session path
 *  - `?subscription_id=sub_…` the custom Payment Element path, which produces
 *                             no session at all
 *
 * Either way the id goes to the matching server confirm endpoint, which syncs
 * the subscription straight from Stripe — activation does NOT depend on
 * webhook delivery (webhooks don't reach local/dev backends, and can lag in
 * production). Polling billing/status stays as the fallback path (it also
 * catches the webhook winning the race).
 *
 * Three outcomes, not two: the confirm payloads already carry enough to KNOW a
 * purchase failed (expired session, `payment_status: "unpaid"`, a dead
 * subscription status, a terminal 4xx), so those render the failed screen
 * immediately instead of burning the full 90s timeout on a result that will
 * never change. The timeout state survives only for the genuinely unknown
 * case — a payment still processing.
 */
export default function CheckoutSuccessClient({
  sessionId,
  subscriptionId,
}: {
  sessionId: string | null;
  subscriptionId: string | null;
}) {
  // Neither id means there is nothing to confirm and nothing to wait for, so
  // skip the spinner entirely rather than polling billing/status for 90s on a
  // company whose status was never going to change.
  const hasReference = Boolean(sessionId || subscriptionId);

  const [phase, setPhase] = useState<Phase>(
    hasReference ? "verifying" : "failed",
  );
  const [planName, setPlanName] = useState<string | null>(null);
  const [failure, setFailure] = useState<FailureCopy>(
    FAILURE_COPY.missing_reference,
  );
  /** Stripe's own hosted invoice page — the one recovery path we can offer
   *  without knowing which plan/cycle the user was buying. */
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!hasReference) return;

    let cancelled = false;
    const startedAt = Date.now();
    let tick = 0;
    // Flips true once confirm has definitively concluded (activated, or a
    // terminal 4xx: bad/foreign/stale session id) — transient failures
    // (network, 5xx, 408/429 throttling) keep retrying.
    let confirmConcluded = false;
<<<<<<< Updated upstream
    // A terminal 4xx is a verdict, not just a reason to stop retrying: we let
    // the status poll in the SAME pass corroborate it (the webhook may have
    // activated the company while confirm rejected a replayed id) and fail
    // only if that poll also comes back short.
    let rejected = false;
    // Once a phase is decided, late-resolving in-flight checks must not
    // overwrite it (e.g. a slow poll flipping "active" back to "timeout").
=======
    // Once confirmation concludes or the deadline fires, late checks cannot
    // change the result or start a conversion transition.
>>>>>>> Stashed changes
    let finished = false;
    let activeObserved = false;
    // A fallback poll must not finish before a pending authoritative confirm.
    let checking = false;

    function finish(next: Phase) {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      clearTimeout(deadlineTimer);
      setPhase(next);
    }

    function fail(reason: FailureReason) {
      if (finished) return;
      setFailure(FAILURE_COPY[reason]);
      finish("failed");
    }

    /**
     * Neither confirm payload carries the plan name, so the entitlement
     * snapshot is the only place it lives. Fetching it is best-effort and
     * never gates the screen — the celebration falls back to a generic name.
     */
    async function succeed(nameFromStatus?: string | null) {
      if (finished) return;
      finish("active");
      if (nameFromStatus) {
        setPlanName(nameFromStatus);
        return;
      }
      try {
        const res = await getBillingStatus();
        if (!cancelled) setPlanName(res?.data?.entitlements?.plan_name ?? null);
      } catch {
        // Generic headline it is.
      }
    }

    function isTerminalConfirmStatus(statusCode: unknown): boolean {
      return (
        typeof statusCode === "number" &&
        [400, 403, 404, 409].includes(statusCode)
      );
    }

    /**
     * Reads a verdict out of the Stripe-hosted session confirm payload
     * (`ICheckoutConfirmResult`). `checkout_status: "open"` is NOT a failure —
     * the session is simply still in flight — so it falls through to polling.
     */
    function verdictFromSession(data: {
      activated?: boolean;
      checkout_status?: string | null;
      payment_status?: string | null;
      subscription_status?: string | null;
    }): "ok" | FailureReason | null {
      if (data.activated || isSuccessStatus(data.subscription_status))
        return "ok";
      if (data.checkout_status === "expired") return "expired";
      // A completed session that still reads "unpaid" means the charge itself
      // failed; "no_payment_required" is a legitimate $0 checkout and must not
      // be swept in here.
      if (
        data.checkout_status === "complete" &&
        data.payment_status === "unpaid"
      ) {
        return "unpaid";
      }
      return DEAD_SUBSCRIPTION_STATUS[data.subscription_status ?? ""] ?? null;
    }

    /**
     * Same, for the custom-checkout payload (`IConfirmSubscriptionResult`).
     * `requires_action` stays pending on purpose — SCA is the checkout page's
     * job, and the intent can still resolve while we poll. Only
     * `requires_payment_method` is a dead end from here.
     */
    function verdictFromSubscription(data: {
      activated?: boolean;
      already_active?: boolean;
      status?: string | null;
      requires_payment_method?: boolean;
    }): "ok" | FailureReason | null {
      if (data.activated || data.already_active || isSuccessStatus(data.status))
        return "ok";
      if (data.requires_payment_method) return "needs_card";
      return DEAD_SUBSCRIPTION_STATUS[data.status ?? ""] ?? null;
    }

    async function check() {
      if (checking || cancelled || finished) return;
      checking = true;
      const currentTick = tick++;
      try {
        // Primary path: server-side confirm straight from Stripe. Both
        // endpoints are idempotent, so retrying alongside the webhook is safe
        // — they converge on the same upsert.
        if (!confirmConcluded && currentTick % CONFIRM_EVERY_N_POLLS === 0) {
          const confirmed = sessionId
            ? await confirmCheckout(sessionId)
            : await confirmSubscription(subscriptionId!);
          if (cancelled || finished) return;
<<<<<<< Updated upstream

          if (confirmed?.success && confirmed.data) {
            const data = confirmed.data;
            if ("hosted_invoice_url" in data && data.hosted_invoice_url) {
              setInvoiceUrl(data.hosted_invoice_url);
            }
            const verdict = sessionId
              ? verdictFromSession(data)
              : verdictFromSubscription(data);
            if (verdict === "ok") {
              await succeed();
              return;
            }
            if (verdict) {
              fail(verdict);
              return;
            }
=======
          if (confirmed?.success === true && confirmed.data?.activated === true) {
            const trackSubscription = storeVerifiedSubscriptionTransition(confirmed);
            finish("active");
            if (trackSubscription) {
              window.location.replace("/billing/subscription-verified");
            }
            return;
>>>>>>> Stashed changes
          }

          if (
            confirmed?.success === false &&
            isTerminalConfirmStatus(confirmed.statusCode)
          ) {
            confirmConcluded = true;
            rejected = true;
          }
        }

        // Once billing is active, its UI can stay visible while a transient
        // confirm failure retries for an authoritative conversion payload.
        if (activeObserved) {
          if (!sessionId || confirmConcluded) finish("active");
          return;
        }

        // Fallback path: the webhook (when it IS delivered) flips the status.
        const res = await getBillingStatus();
        if (cancelled || finished) return;
<<<<<<< Updated upstream
        const entitlements = res?.success ? res.data?.entitlements : null;
        // `trialing` counts here ONLY when a Stripe subscription backs it —
        // otherwise the company's pre-existing reverse trial would report
        // success the instant this page mounts, even on a declined card. The
        // flag is optional on older snapshots; absent, we keep waiting rather
        // than guess in the user's favour.
        const trialIsPurchased =
          entitlements?.status === "trialing" &&
          entitlements?.has_billing_subscription === true;
        if (entitlements?.status === "active" || trialIsPurchased) {
          await succeed(entitlements?.plan_name);
          return;
        }
        // Confirm rejected the id outright and the status poll agrees nothing
        // activated — that verdict is final, so stop spinning.
        if (rejected) {
          fail("rejected");
=======
        if (res?.success && res.data?.entitlements?.status === "active") {
          activeObserved = true;
          if (sessionId && !confirmConcluded) setPhase("active");
          else finish("active");
>>>>>>> Stashed changes
          return;
        }
      } catch {
        // Network hiccup — keep polling until the timeout.
      } finally {
        checking = false;
      }
      if (!cancelled && Date.now() - startedAt >= TIMEOUT_MS) {
        finish(activeObserved ? "active" : "timeout");
      }
    }

    const timer = setInterval(() => {
      void check();
    }, POLL_INTERVAL_MS);
    // The API transport may hang. This deadline must not depend on an awaited
    // confirm/status request settling before the timeout state can render.
    const deadlineTimer = setTimeout(() => {
      if (!cancelled) finish(activeObserved ? "active" : "timeout");
    }, TIMEOUT_MS);
    void check();

    return () => {
      cancelled = true;
      clearInterval(timer);
      clearTimeout(deadlineTimer);
    };
  }, [sessionId, subscriptionId, hasReference]);

  if (phase === "active") return <SuccessCelebration planName={planName} />;

  return (
    <div className="w-full max-w-md rounded-2xl border border-borderColor bg-bgPrimary p-6 text-center shadow-sm sm:p-8 dark:border-darkBorder dark:bg-darkPrimaryBg">
      {phase === "verifying" && (
        <>
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <h1 className="mt-4 text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">
            Finalizing your subscription
          </h1>
          <p className="mt-1.5 text-sm text-subTextColor dark:text-darkTextSecondary">
            This usually takes a few seconds.
          </p>
        </>
      )}

      {phase === "failed" && (
        <>
          <XCircle className="mx-auto h-10 w-10 text-red-500 dark:text-red-400" />
          <h1 className="mt-4 text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">
            {failure.title}
          </h1>
          <p className="mt-1.5 text-sm text-subTextColor dark:text-darkTextSecondary">
            {failure.description}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href={RETRY_URL}>
                <ArrowLeft className="size-4" />
                Choose a plan again
              </Link>
            </Button>
            <Button asChild variant="outline2" className="w-full">
              <Link href={BILLING_URL}>View billing</Link>
            </Button>
            {invoiceUrl && (
              <a
                href={invoiceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                Or pay this invoice on Stripe
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        </>
      )}

      {phase === "timeout" && (
        <>
          <Clock className="mx-auto h-10 w-10 text-amber-500 dark:text-amber-400" />
          <h1 className="mt-4 text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">
            Taking longer than expected
          </h1>
          <p className="mt-1.5 text-sm text-subTextColor dark:text-darkTextSecondary">
            Your payment may still be processing — check back in a minute.
          </p>
          <div className="mt-6">
            <Button asChild variant="outline2" className="w-full">
              <Link href={BILLING_URL}>View billing</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
