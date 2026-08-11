"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";

import { confirmCheckout, getBillingStatus } from "@/actions/billing/action";
import { BILLING_URL } from "@/lib/billing";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 4000;
const TIMEOUT_MS = 90_000;
/** Re-attempt server-side confirm every Nth poll (~12s) until it concludes. */
const CONFIRM_EVERY_N_POLLS = 3;

type Phase = "verifying" | "active" | "timeout";

/**
 * Client for the standalone /billing/success page (rendered OUTSIDE the main
 * layout — no billing store here). Stripe redirects the browser back here
 * with a `session_id`; we hand it to `packages/checkout/confirm`, which syncs
 * the subscription straight from Stripe — activation does NOT depend on
 * webhook delivery (webhooks don't reach local/dev backends, and can lag in
 * production). Polling billing/status stays as the fallback path (it also
 * catches the webhook winning the race), giving up after ~90s with a soft
 * "check back in a minute" state.
 */
export default function CheckoutSuccessClient({
  sessionId,
}: {
  sessionId: string | null;
}) {
  const [phase, setPhase] = useState<Phase>("verifying");

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();
    let tick = 0;
    // Flips true once confirm has definitively concluded (activated, or a
    // terminal 4xx: bad/foreign/stale session id) — transient failures
    // (network, 5xx, 408/429 throttling) keep retrying.
    let confirmConcluded = false;
    // Once a phase is decided, late-resolving in-flight checks must not
    // overwrite it (e.g. a slow poll flipping "active" back to "timeout").
    let finished = false;

    function finish(next: Phase) {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      setPhase(next);
    }

    function isTerminalConfirmStatus(statusCode: unknown): boolean {
      return (
        typeof statusCode === "number" &&
        [400, 403, 404, 409].includes(statusCode)
      );
    }

    async function check() {
      const currentTick = tick++;
      try {
        // Primary path: server-side confirm straight from Stripe. Idempotent,
        // so retrying alongside the webhook is safe — both converge on the
        // same upsert.
        if (
          sessionId &&
          !confirmConcluded &&
          currentTick % CONFIRM_EVERY_N_POLLS === 0
        ) {
          const confirmed = await confirmCheckout(sessionId);
          if (cancelled || finished) return;
          if (confirmed?.success && confirmed.data?.activated) {
            finish("active");
            return;
          }
          if (
            confirmed?.success === false &&
            isTerminalConfirmStatus(confirmed.statusCode)
          ) {
            confirmConcluded = true;
          }
        }

        // Fallback path: the webhook (when it IS delivered) flips the status.
        const res = await getBillingStatus();
        if (cancelled || finished) return;
        if (res?.success && res.data?.entitlements?.status === "active") {
          finish("active");
          return;
        }
      } catch {
        // Network hiccup — keep polling until the timeout.
      }
      if (!cancelled && Date.now() - startedAt >= TIMEOUT_MS) {
        finish("timeout");
      }
    }

    const timer = setInterval(() => {
      void check();
    }, POLL_INTERVAL_MS);
    void check();

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [sessionId]);

  return (
    <div className="w-full max-w-md rounded-lg border border-borderColor bg-white p-6 text-center sm:p-8 dark:border-darkBorder dark:bg-darkPrimaryBg">
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

      {phase === "active" && (
        <>
          <CheckCircle2 className="mx-auto h-10 w-10 text-green-600 dark:text-green-400" />
          <h1 className="mt-4 text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">
            You&apos;re all set!
          </h1>
          <p className="mt-1.5 text-sm text-subTextColor dark:text-darkTextSecondary">
            Your plan is active.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>
            <Button asChild variant="outline2">
              <Link href={BILLING_URL}>View billing</Link>
            </Button>
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
            <Button asChild variant="outline2">
              <Link href={BILLING_URL}>View billing</Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
