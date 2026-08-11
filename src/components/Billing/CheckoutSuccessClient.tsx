"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, Loader2 } from "lucide-react";

import { getBillingStatus } from "@/actions/billing/action";
import { BILLING_URL } from "@/lib/billing";
import { Button } from "@/components/ui/button";

const POLL_INTERVAL_MS = 4000;
const TIMEOUT_MS = 90_000;

type Phase = "verifying" | "active" | "timeout";

/**
 * Client for the standalone /billing/success page (rendered OUTSIDE the main
 * layout — no billing store here). Stripe redirects the browser back to this
 * page after checkout; the webhook usually flips the subscription to "active"
 * within seconds, so we poll billing/status every 4s until it does (giving up
 * after ~90s with a soft "check back in a minute" state).
 */
export default function CheckoutSuccessClient() {
  const [phase, setPhase] = useState<Phase>("verifying");

  useEffect(() => {
    let cancelled = false;
    const startedAt = Date.now();

    async function check() {
      try {
        const res = await getBillingStatus();
        if (cancelled) return;
        if (res?.success && res.data?.entitlements?.status === "active") {
          clearInterval(timer);
          setPhase("active");
          return;
        }
        // Envelope failure or not-yet-active: keep polling until the timeout —
        // the webhook is what flips the status.
      } catch {
        // Network hiccup — keep polling until the timeout.
      }
      if (!cancelled && Date.now() - startedAt >= TIMEOUT_MS) {
        clearInterval(timer);
        setPhase("timeout");
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
  }, []);

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
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
    </div>
  );
}
