"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { BILLING_URL } from "@/lib/billing";
import { useBillingStore } from "@/store/billingStore";
import type { IBillingStatus } from "@/types/billing";
import { Button } from "@/components/ui/button";

/**
 * Full-width red payment-failure banner (contract §3, guide §4). Shown on
 * every page while status is past_due / payment_failed. Polls billing/status
 * every 5s while mounted; when `blocked` flips back to false (webhook after
 * the invoice is paid) it toasts "Payment received — access restored."
 *
 * Renders the status BillingGate decided on (the store's, else the layout's
 * server snapshot), not the store directly: the store is still empty in the
 * server and hydration renders, which painted the generic message without the
 * "Pay now" button until the snapshot reached the store.
 */
export default function PaymentFailureBanner({
  status,
}: {
  status: IBillingStatus | null;
}) {
  const startPolling = useBillingStore((s) => s.startPolling);

  // From the status on screen: on a fresh load the store is still empty here
  // (the snapshot reaches it after this mount), and a first poll that already
  // found the invoice paid then passed without the recovery toast.
  const prevBlockedRef = useRef<boolean>(status?.blocked ?? false);

  useEffect(() => {
    const releasePoll = startPolling(5000);
    // Store-level subscription so the recovery toast fires even if the banner
    // is unmounted in the same commit the status flips.
    const unsubscribe = useBillingStore.subscribe((state) => {
      // No status means the store was reset (sign-out, or another account
      // signing in under this open tab), not that anything was paid. That
      // reset can land while this banner is still subscribed, before its
      // cleanup runs, so it must not read as "unblocked".
      if (!state.status) {
        prevBlockedRef.current = false;
        return;
      }
      const blocked = state.status.blocked ?? false;
      if (prevBlockedRef.current && !blocked) {
        toast.success("Payment received — access restored.");
      }
      prevBlockedRef.current = blocked;
    });
    return () => {
      unsubscribe();
      releasePoll();
    };
  }, [startPolling]);

  const message = status?.block?.message || "Your last payment failed.";
  const invoiceUrl = status?.latest_unpaid_invoice?.hosted_invoice_url ?? null;

  return (
    <div className="w-full border-b border-red-200 bg-red-50 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/15">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-300" />
          <div className="text-sm">
            <p className="font-medium text-red-800 dark:text-red-200">
              {message}
            </p>
            <p className="text-red-700/90 dark:text-red-200/80">
              Time tracking is paused for your team until the invoice is
              settled.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 pl-6 sm:pl-0">
          {invoiceUrl && (
            <Button
              size="sm"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() =>
                window.open(invoiceUrl, "_blank", "noopener,noreferrer")
              }
            >
              Pay now
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
          <Link
            href={BILLING_URL}
            className="text-sm font-medium text-red-700 underline underline-offset-2 hover:text-red-800 dark:text-red-200 dark:hover:text-red-100"
          >
            Billing details
          </Link>
        </div>
      </div>
    </div>
  );
}
