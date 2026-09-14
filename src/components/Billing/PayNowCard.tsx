"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CreditCard,
  ExternalLink,
  FileText,
  Loader2,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatBillingDate, formatCents } from "@/lib/billing";
import { invoiceDetailHref, isInvoicePayable } from "@/lib/invoice";
import { payInvoice } from "@/actions/billing/action";
import { IBillingInvoice } from "@/types/billing";
import InvoiceStatusBadge from "@/components/Billing/Invoice/InvoiceStatusBadge";
import { useBillingRefresh } from "@/components/Billing/useBillingRefresh";

/**
 * Card for `latest_unpaid_invoice` (guide §4).
 *
 * Two ways to settle it, in this order:
 *
 * 1. **In-app "Pay now"** — `POST /billing/invoices/:id/pay`, charging the
 *    card already on file. One click, no tab switch, and the entitlement cache
 *    is invalidated server-side the way the webhook does it.
 * 2. **Stripe's hosted invoice page** — kept deliberately, not as dead code.
 *    It is the fallback whenever (1) cannot finish on its own: the invoice
 *    predates our id column, there is no saved card to charge, or the bank
 *    demands 3-D Secure. Building an SCA flow inside this card would duplicate
 *    the checkout page's PaymentElement for a surface a user sees once.
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
  const refreshBilling = useBillingRefresh();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * Set when the bank asks for 3-D Secure. Rendered as a link rather than
   * opened with `window.open`: this fires after an `await`, so the browser no
   * longer counts it as a user gesture and most popup blockers eat it — which
   * would look exactly like "Pay now did nothing".
   */
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);

  const openHostedInvoice = () => {
    if (invoice.hosted_invoice_url) {
      window.open(invoice.hosted_invoice_url, "_blank", "noopener,noreferrer");
    }
  };

  const handlePayNow = async () => {
    // `id` is absent on payloads that predate the detail endpoint; those can
    // only be settled on Stripe's page.
    if (typeof invoice.id !== "number") {
      openHostedInvoice();
      return;
    }

    setPaying(true);
    setError(null);
    setVerifyUrl(null);
    try {
      const res = await payInvoice(invoice.id);

      if (res?.success && res.data) {
        if (res.data.paid) {
          toast.success("Payment received — thank you.");
          // Read-after-write: the status refetch is what clears the lockout and
          // applies a parked seat/plan change without a reload.
          await refreshBilling();
          return;
        }

        if (res.data.requires_action) {
          // The bank wants 3-D Secure. Hand it to Stripe's hosted page rather
          // than growing a second SCA implementation here; the webhook applies
          // the outcome when the user finishes.
          setVerifyUrl(
            res.data.hosted_invoice_url ?? invoice.hosted_invoice_url ?? null,
          );
          if (!res.data.hosted_invoice_url && !invoice.hosted_invoice_url) {
            setError(
              "Your bank needs to verify this payment, but Stripe did not return a verification page. Please contact support.",
            );
          }
          return;
        }

        setError(
          "The payment did not go through. Try another card or pay on Stripe's page.",
        );
        return;
      }

      setError(res?.message || "Could not take the payment. Please try again.");
    } catch {
      setError("Something went wrong while taking the payment.");
    } finally {
      setPaying(false);
    }
  };

  if (invoice.voided) return null;

  const documentHref = invoiceDetailHref(invoice);
  const hostedPayable = isInvoicePayable(invoice);
  // The in-app path needs a row id but not a hosted URL — a Stripe-side
  // invoice with no hosted page is still payable through the API.
  const canPayInApp =
    !invoice.voided &&
    invoice.status !== "paid" &&
    (invoice.amount_due_cents ?? 0) > 0 &&
    typeof invoice.id === "number";

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
              ? "We'll charge the card on file for your workspace. Access and time tracking resume automatically within seconds. Manage or replace that card under Billing → Change Card."
              : "Your requested seat or plan change is on hold until this invoice is paid — it applies automatically within seconds of payment. If it stays unpaid, the request simply expires and your current subscription continues unchanged."}
          </p>

          {verifyUrl && (
            <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
              Your bank needs to verify this payment.{" "}
              <a
                href={verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2"
              >
                Complete verification on Stripe
              </a>
            </p>
          )}

          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end shrink-0">
          {canPayInApp && (
            <Button
              onClick={() => void handlePayNow()}
              disabled={paying}
              className={accent.button}
            >
              {paying ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Pay now
            </Button>
          )}
          {hostedPayable && (
            <Button
              type="button"
              variant="outline2"
              onClick={openHostedInvoice}
              disabled={paying}
            >
              <ExternalLink className="h-4 w-4" />
              {canPayInApp ? "Pay on Stripe" : "Pay now"}
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
