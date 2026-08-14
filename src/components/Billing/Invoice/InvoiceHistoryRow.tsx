"use client";

import Link from "next/link";
import { ExternalLink, FileText, Receipt } from "lucide-react";

import { TableCell, TableRow } from "@/components/ui/table";
import { formatBillingDate } from "@/lib/billing";
import { formatBillingReason, invoiceDetailHref } from "@/lib/invoice";
import { IBillingInvoice } from "@/types/billing";

import InvoiceAmount from "./InvoiceAmount";
import InvoiceStatusBadge from "./InvoiceStatusBadge";

const iconLink =
  "text-subTextColor dark:text-darkTextSecondary hover:text-headingTextColor dark:hover:text-darkTextPrimary";

/**
 * One row of the invoice history.
 *
 * The document link is derived from `detail_path` (the guide's instruction:
 * don't build the URL yourself); rows from a payload that predates it simply
 * render without a link instead of pointing at a guessed route.
 */
export default function InvoiceHistoryRow({
  invoice,
}: {
  invoice: IBillingInvoice;
}) {
  const href = invoiceDetailHref(invoice);
  // Derived server-side and already 0 for a voided invoice — no client-side
  // compensation is applied on top of it.
  const outstanding = invoice.voided ? 0 : (invoice.amount_due_cents ?? 0);

  return (
    <TableRow>
      <TableCell>
        {href ? (
          <Link
            href={href}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {invoice.invoice_number}
          </Link>
        ) : (
          invoice.invoice_number
        )}
      </TableCell>

      <TableCell>{formatBillingDate(invoice.created_at)}</TableCell>

      <TableCell>{formatBillingReason(invoice.billing_reason) ?? "—"}</TableCell>

      <TableCell>
        {formatBillingDate(invoice.period_start)} →{" "}
        {formatBillingDate(invoice.period_end)}
      </TableCell>

      <TableCell>
        <InvoiceAmount cents={invoice.total_cents} currency={invoice.currency} />
        {outstanding > 0 && (
          <span className="block text-xs text-orange-600 dark:text-orange-400">
            <InvoiceAmount cents={outstanding} currency={invoice.currency} /> due
          </span>
        )}
      </TableCell>

      <TableCell>
        <InvoiceStatusBadge invoice={invoice} />
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-3">
          {href && (
            <Link href={href} title="View invoice" className={iconLink}>
              <Receipt className="h-4 w-4" />
            </Link>
          )}
          {invoice.hosted_invoice_url && (
            <a
              href={invoice.hosted_invoice_url}
              target="_blank"
              rel="noopener noreferrer"
              title="View invoice on Stripe"
              className={iconLink}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {invoice.invoice_pdf && (
            <a
              href={invoice.invoice_pdf}
              target="_blank"
              rel="noopener noreferrer"
              title="Stripe PDF"
              className={iconLink}
            >
              <FileText className="h-4 w-4" />
            </a>
          )}
          {!href && !invoice.hosted_invoice_url && !invoice.invoice_pdf && (
            <span className="text-subTextColor dark:text-darkTextSecondary">—</span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
