"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, ExternalLink, Loader2, XCircle } from "lucide-react";

import {
  confirmCheckout,
  confirmSubscription,
  getBillingStatus,
} from "@/actions/billing/action";
import { BILLING_URL } from "@/lib/billing";
import { storeVerifiedSubscriptionTransition } from "@/lib/verifiedSubscriptionTransition";
import type { IBillingEntitlements } from "@/types/billing";
import { Button } from "@/components/ui/button";
import SuccessCelebration from "./SuccessCelebration";

const POLL_INTERVAL_MS = 4000;
const TIMEOUT_MS = 90_000;
/**
 * The wait when there is NO checkout reference (see the component docblock):
 * nothing is being confirmed, only billing/status is read, so a fraction of
 * the payment-processing budget above is plenty — an active company answers
 * on the first poll, and a stray link must not spin for a minute and a half.
 */
const STATUS_ONLY_TIMEOUT_MS = 15_000;
/** Re-attempt server-side confirm every Nth poll (~12s) until it concludes. */
const CONFIRM_EVERY_N_POLLS = 3;
/**
 * The bare document the purchase conversion fires on. It must be reached by a
 * full navigation with no query/hash (`isSafeDocument` in
 * `@/lib/verifiedSubscriptionGoogleAds`), and it returns here without a
 * reference once the tag has had its bounded chance.
 */
const CONVERSION_URL = "/billing/subscription-verified";

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
 * "The purchase went through" as billing/status reports it. Neither status
 * counts on its own: a free/downgraded plan is `active` with no Stripe
 * subscription behind it, and `trialing` alone is the company's pre-existing
 * reverse trial — either would report success the instant this page mounts,
 * even on a declined card. Only a Stripe-backed snapshot is proof. The flag is
 * optional on older cached snapshots; absent, we keep waiting rather than
 * guess in the user's favour.
 */
const isPurchasedEntitlement = (
  entitlements: IBillingEntitlements | null | undefined,
): boolean =>
  isSuccessStatus(entitlements?.status) &&
  entitlements?.has_billing_subscription === true;

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
 *
 * Purchase conversion (Google Ads): a live, paid session confirm also carries
 * `subscription_conversion`. That rides sessionStorage through a
 * full navigation to the bare `CONVERSION_URL` document, which fires the tag
 * and then returns here with NO reference at all — by design, so the tag never
 * sees a param-bearing URL. A reference-less visit is therefore not an error:
 * it reads billing/status for a short, bounded window and celebrates an active
 * purchase; only a company that is not subscribed gets the "missing reference"
 * failure. The custom-checkout confirm carries no conversion payload today, so
 * that path never detours.
 */
export default function CheckoutSuccessClient({
  sessionId,
  subscriptionId,
}: {
  sessionId: string | null;
  subscriptionId: string | null;
}) {
  // With neither id there is nothing to confirm; the page can only read
  // billing/status (the conversion detour's return trip, or a stray link), so
  // confirm is skipped and the wait is the short status-only budget.
  const hasReference = Boolean(sessionId || subscriptionId);

  const [phase, setPhase] = useState<Phase>("verifying");
  const [planName, setPlanName] = useState<string | null>(null);
  const [failure, setFailure] = useState<FailureCopy>(
    FAILURE_COPY.missing_reference,
  );
  /** Stripe's own hosted invoice page — the one recovery path we can offer
   *  without knowing which plan/cycle the user was buying. */
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  /**
   * Set when the user takes an exit from the celebration. A conversion hand-off
   * that resolves after that must not replace the navigation they chose. A ref,
   * not state: the poll closure needs the live value, not a render's snapshot.
   */
  const leavingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();
    const timeoutMs = hasReference ? TIMEOUT_MS : STATUS_ONLY_TIMEOUT_MS;
    let tick = 0;
    // Flips true once confirm has definitively concluded (activated, or a
    // terminal 4xx: bad/foreign/stale session id) — transient failures
    // (network, 5xx, 408/429 throttling) keep retrying.
    let confirmConcluded = false;
    // A terminal 4xx is a verdict, not just a reason to stop retrying: we let
    // the status poll in the SAME pass corroborate it (the webhook may have
    // activated the company while confirm rejected a replayed id) and fail
    // only if that poll also comes back short.
    let rejected = false;
    // Once a phase is decided, late-resolving in-flight checks must not
    // overwrite it (e.g. a slow poll flipping "active" back to "timeout") nor
    // start a conversion hand-off after the fact.
    let finished = false;
    // billing/status has reported the purchase live. On the session path that
    // paints the celebration WITHOUT finishing: the status snapshot carries no
    // conversion payload, so confirm keeps retrying for one until it concludes
    // or the deadline fires (see `check()`).
    let activeObserved = false;
    let observedPlanName: string | null = null;
    // A fallback poll must not overlap a pending authoritative confirm.
    let checking = false;
    // A bare visit's deadline must tell "billing/status said no" apart from
    // "billing/status never answered": only the former is a missing reference.
    let statusAnswered = false;
    // Once the celebration is painted from billing/status, confirm gets ONE
    // more attempt (pulled forward to the next tick) to deliver a conversion
    // payload. Beyond that a detour would interrupt a celebration the user is
    // already reading, which is not worth a rare analytics event.
    let confirmRetriedAfterActive = false;

    function finish(next: Phase) {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      clearTimeout(deadlineTimer);
      setPhase(next);
    }

    function fail(reason: FailureReason) {
      if (finished) return;
      // An activation billing/status already reported outranks a later dead
      // verdict from a re-synced confirm: a celebration that is already on
      // screen must never flip into a failure card.
      if (activeObserved) {
        finish("active");
        return;
      }
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
      const known = nameFromStatus ?? observedPlanName;
      if (known) {
        setPlanName(known);
        return;
      }
      try {
        const res = await getBillingStatus();
        if (!cancelled) setPlanName(res?.data?.entitlements?.plan_name ?? null);
      } catch {
        // Generic headline it is.
      }
    }

    /**
     * The purchase-conversion hand-off. Only an authoritative session confirm
     * stores a transition — the backend attaches `subscription_conversion`
     * solely to a live-mode, paid, active, ownership-checked session (and
     * re-sends it on every confirm of that same session), while the store
     * helper re-validates the payload shape and skips a conversion this tab
     * already handled. So the custom-checkout path, test mode and a refresh of
     * this URL all return false and the celebration renders here as usual; a
     * replay in a fresh tab does detour again and relies on Google's
     * transaction-id de-duplication.
     *
     * A click the user already made on the celebration always wins over a
     * late hand-off. Otherwise the celebration is committed BEFORE navigating
     * so a navigation that never happens can never strand the user on a
     * spinner; the bare conversion document then returns here without a
     * reference and the status-only read repaints the same screen.
     */
    function handOffForConversion(confirmed: unknown): boolean {
      if (finished || leavingRef.current) return false;
      if (!storeVerifiedSubscriptionTransition(confirmed)) return false;
      finish("active");
      window.location.replace(CONVERSION_URL);
      return true;
    }

    /**
     * What the deadline settles on: the celebration if the purchase was ever
     * seen live; otherwise "still processing" when there was a reference to
     * process OR billing/status never answered (an outage must not call the
     * link broken — least of all on the conversion detour's return trip); the
     * missing-reference failure only when status answered and showed no
     * Stripe-backed subscription.
     */
    function settleAtDeadline() {
      if (activeObserved) {
        finish("active");
        return;
      }
      if (hasReference || !statusAnswered) {
        finish("timeout");
        return;
      }
      fail("missing_reference");
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
        // — they converge on the same upsert. Nothing to confirm without a
        // reference.
        if (
          hasReference &&
          !confirmConcluded &&
          currentTick % CONFIRM_EVERY_N_POLLS === 0
        ) {
          if (activeObserved) confirmRetriedAfterActive = true;
          const confirmed = sessionId
            ? await confirmCheckout(sessionId)
            : await confirmSubscription(subscriptionId!);
          if (cancelled || finished) return;

          if (confirmed?.success && confirmed.data) {
            const data = confirmed.data;
            if ("hosted_invoice_url" in data && data.hosted_invoice_url) {
              setInvoiceUrl(data.hosted_invoice_url);
            }
            const verdict = sessionId
              ? verdictFromSession(data)
              : verdictFromSubscription(data);
            if (verdict === "ok") {
              if (handOffForConversion(confirmed)) return;
              await succeed();
              return;
            }
            if (verdict) {
              fail(verdict);
              return;
            }
          }

          if (
            confirmed?.success === false &&
            isTerminalConfirmStatus(confirmed.statusCode)
          ) {
            confirmConcluded = true;
            rejected = true;
          }
        }

        // The celebration is already up from an earlier status poll and only
        // confirm can still add anything (a conversion payload). Status has
        // nothing more to say; finish as soon as confirm is out of the picture
        // or has had its one post-celebration attempt.
        if (activeObserved) {
          if (!sessionId || confirmConcluded || confirmRetriedAfterActive) {
            finish("active");
          }
          return;
        }

        // Fallback path: the webhook (when it IS delivered) flips the status —
        // and the only path at all without a reference.
        const res = await getBillingStatus();
        if (cancelled || finished) return;
        if (res?.success) statusAnswered = true;
        const entitlements = res?.success ? res.data?.entitlements : null;
        if (isPurchasedEntitlement(entitlements)) {
          activeObserved = true;
          observedPlanName = entitlements?.plan_name ?? null;
          // Session path with confirm still pending: paint the celebration now
          // and pull confirm's one remaining attempt forward to the next tick
          // (instead of the usual every-Nth cadence) so it can still return
          // the conversion payload the status snapshot cannot carry. Every
          // other path is done here.
          if (sessionId && !confirmConcluded) {
            setPlanName(observedPlanName);
            setPhase("active");
            tick =
              Math.ceil(tick / CONFIRM_EVERY_N_POLLS) * CONFIRM_EVERY_N_POLLS;
          } else {
            await succeed(observedPlanName);
          }
          return;
        }
        // Confirm rejected the id outright and the status poll agrees nothing
        // activated — that verdict is final, so stop spinning.
        if (rejected) {
          fail("rejected");
          return;
        }
      } catch {
        // Network hiccup — keep polling until the timeout.
      } finally {
        checking = false;
      }
      if (!cancelled && Date.now() - startedAt >= timeoutMs) {
        settleAtDeadline();
      }
    }

    const timer = setInterval(() => {
      void check();
    }, POLL_INTERVAL_MS);
    // The API transport may hang. This deadline must not depend on an awaited
    // confirm/status request settling before the final state can render.
    const deadlineTimer = setTimeout(() => {
      if (!cancelled) settleAtDeadline();
    }, timeoutMs);
    void check();

    return () => {
      cancelled = true;
      clearInterval(timer);
      clearTimeout(deadlineTimer);
    };
  }, [sessionId, subscriptionId, hasReference]);

  if (phase === "active") {
    return (
      <SuccessCelebration
        planName={planName}
        onExit={() => {
          leavingRef.current = true;
        }}
      />
    );
  }

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
