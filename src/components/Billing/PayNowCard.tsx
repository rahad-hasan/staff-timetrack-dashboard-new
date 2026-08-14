"use client";

import Link from "next/link";
import { AlertTriangle, ExternalLink, FileText, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBillingDate, formatCents } from "@/lib/billing";
import { invoiceDetailHref, isInvoicePayable } from "@/lib/invoice";
import { IBillingInvoice } from "@/types/billing";
import InvoiceStatusBadge from "@/components/Billing/Invoice/InvoiceStatusBadge";

/**
 * Card for `latest_unpaid_invoice` (guide §4). "Pay now" opens Stripe's
 * hosted invoice page — it handles 3-D Secure and updates the default card;
 * the webhook applies the outcome automatically after payment.
 *
 * `blocking` mirrors the subscription state: red + "access resumes" copy when
 * the workspace is locked (renewal failure), amber + "change on hold" copy
 * for a declined seat/plan-change proration on a still-active subscription —
 * that change stays parked until paid and simply expires if it never is.
 *
 * A voided invoice is not owed even though Stripe reports it as `refunded`
 * with a historical balance, so the whole card is suppressed for one — the
 * guide requires every "Pay now" affordance to disappear.
 */
export default function PayNowCard({
  invoice,
  blocking = true,
}: {
  invoice: IBillingInvoice;
  blocking?: boolean;
}) {
  const handlePayNow = () => {
    if (invoice.hosted_invoice_url) {
      window.open(invoice.hosted_invoice_url, "_blank", "noopener,noreferrer");
    }
  };

  if (invoice.voided) return null;

  const documentHref = invoiceDetailHref(invoice);

  const accent = blocking
    ? {
        border: "border-red-300 dark:border-red-500/40",
        icon: "text-red-600 dark:text-red-400",
        button: "bg-red-600 text-white hover:bg-red-700",
      }
    : {
        border: "border-amber-300 dark:border-amber-500/40",
        icon: "text-amber-600 dark:text-amber-400",
        button: "bg-amber-600 text-white hover:bg-amber-700",
      };

  return (
    <div
      className={cn(
        "border rounded-lg p-3 sm:p-4 bg-white dark:bg-darkPrimaryBg",
        accent.border,
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <AlertTriangle className={cn("h-5 w-5 shrink-0", accent.icon)} />
            <h3 className="text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">
              {blocking
                ? `Unpaid invoice ${invoice.invoice_number}`
                : `Pending change awaiting payment — ${invoice.invoice_number}`}
            </h3>
            <InvoiceStatusBadge invoice={invoice} />
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
            {blocking
              ? "Payment is handled on Stripe's secure page and updates your default card. Access and time tracking resume automatically within seconds."
              : "Your requested seat or plan change is on hold until this invoice is paid — it applies automatically within seconds of payment. If it stays unpaid, the request simply expires and your current subscription continues unchanged."}
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end shrink-0">
          {isInvoicePayable(invoice) && (
            <Button onClick={handlePayNow} className={accent.button}>
              <ExternalLink className="h-4 w-4" />
              Pay now
            </Button>
          )}
          {documentHref && (
            <Link
              href={documentHref}
              className="inline-flex items-center justify-center gap-1.5 text-sm text-subTextColor underline underline-offset-2 hover:text-headingTextColor dark:text-darkTextSecondary dark:hover:text-darkTextPrimary"
            >
              <Receipt className="h-4 w-4" />
              View invoice
            </Link>
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
