"use client";

import { AlertTriangle, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  formatBillingDate,
  formatCents,
  INVOICE_STATUS_STYLES,
} from "@/lib/billing";
import { IBillingInvoice } from "@/types/billing";

/**
 * Red-bordered card for `latest_unpaid_invoice` (guide §4). "Pay now" opens
 * Stripe's hosted invoice page — it handles 3-D Secure and updates the default
 * card; the webhook restores access automatically after payment.
 */
export default function PayNowCard({ invoice }: { invoice: IBillingInvoice }) {
  const handlePayNow = () => {
    if (invoice.hosted_invoice_url) {
      window.open(invoice.hosted_invoice_url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="border border-red-300 dark:border-red-500/40 rounded-lg p-3 sm:p-4 bg-white dark:bg-darkPrimaryBg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            <h3 className="text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">
              Unpaid invoice {invoice.invoice_number}
            </h3>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                INVOICE_STATUS_STYLES[invoice.status],
              )}
            >
              {invoice.status}
            </span>
          </div>

          <p className="text-2xl font-semibold text-headingTextColor dark:text-darkTextPrimary mb-1">
            {formatCents(invoice.amount_due_cents, invoice.currency)}
            <span className="ml-2 text-sm font-normal text-subTextColor dark:text-darkTextSecondary">
              due now
            </span>
          </p>

          <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
            Billing period: {formatBillingDate(invoice.period_start)} →{" "}
            {formatBillingDate(invoice.period_end)}
          </p>

          <p className="mt-3 text-sm text-subTextColor dark:text-darkTextSecondary">
            Payment is handled on Stripe&apos;s secure page and updates your
            default card. Access and time tracking resume automatically within
            seconds.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end shrink-0">
          {invoice.hosted_invoice_url && (
            <Button
              onClick={handlePayNow}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <ExternalLink className="h-4 w-4" />
              Pay now
            </Button>
          )}
          {invoice.invoice_pdf && (
            <a
              href={invoice.invoice_pdf}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-sm text-subTextColor dark:text-darkTextSecondary hover:text-headingTextColor dark:hover:text-darkTextPrimary underline underline-offset-2"
            >
              <FileText className="h-4 w-4" />
              Download PDF
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
