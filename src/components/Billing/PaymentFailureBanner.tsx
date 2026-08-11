"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { BILLING_URL } from "@/lib/billing";
import { useBillingStore } from "@/store/billingStore";
import { Button } from "@/components/ui/button";

/**
 * Full-width red payment-failure banner (contract §3, guide §4). Shown on
 * every page while status is past_due / payment_failed. Polls billing/status
 * every 5s while mounted; when `blocked` flips back to false (webhook after
 * the invoice is paid) it toasts "Payment received — access restored."
 */
export default function PaymentFailureBanner() {
  const status = useBillingStore((s) => s.status);
  const startPolling = useBillingStore((s) => s.startPolling);
  const stopPolling = useBillingStore((s) => s.stopPolling);

  const prevBlockedRef = useRef<boolean>(
    useBillingStore.getState().status?.blocked ?? false,
  );

  useEffect(() => {
    startPolling(5000);
    // Store-level subscription so the recovery toast fires even if the banner
    // is unmounted in the same commit the status flips.
    const unsubscribe = useBillingStore.subscribe((state) => {
      const blocked = state.status?.blocked ?? false;
      if (prevBlockedRef.current && !blocked) {
        toast.success("Payment received — access restored.");
      }
      prevBlockedRef.current = blocked;
    });
    return () => {
      unsubscribe();
      stopPolling();
    };
  }, [startPolling, stopPolling]);

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
