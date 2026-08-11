"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import { cn } from "@/lib/utils";
import {
  formatBillingDate,
  formatCents,
  INVOICE_STATUS_STYLES,
} from "@/lib/billing";
import { getBillingInvoices } from "@/actions/billing/action";
import { IBillingInvoice } from "@/types/billing";

const LIMIT = 10;

const COLUMNS = [
  "Invoice #",
  "Date",
  "Billing reason",
  "Period",
  "Total",
  "Status",
  "Actions",
];

/**
 * Self-contained invoice history (guide §4): fetches its own pages via local
 * state (NOT the ?page= URL param — this table paginates independently).
 */
export default function InvoiceHistoryTable() {
  const [page, setPage] = useState(1);
  const [invoices, setInvoices] = useState<IBillingInvoice[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getBillingInvoices({ page, limit: LIMIT });
        if (cancelled) return;
        if (res?.success) {
          setInvoices(res.data ?? []);
          setTotalPages(Math.max(1, res.meta?.totalPages ?? 1));
        } else {
          setError(res?.message || "Failed to load invoices.");
        }
      } catch {
        if (!cancelled) {
          toast.error("Something went wrong while loading invoices.");
          setError("Something went wrong while loading invoices.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="border border-borderColor rounded-lg p-3 sm:p-4 bg-white dark:bg-darkPrimaryBg dark:border-darkBorder">
      <h3 className="text-lg font-medium text-headingTextColor dark:text-darkTextPrimary mb-1">
        Invoice history
      </h3>
      <p className="text-sm text-subTextColor dark:text-darkTextSecondary mb-4">
        Every charge on your subscription, with Stripe-hosted receipts and PDFs.
      </p>

      {error && (
        <p className="mb-3 rounded-md bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((col) => (
              <TableHead key={col}>{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {COLUMNS.map((col) => (
                  <TableCell key={col}>
                    <div className="h-4 w-full max-w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : invoices.length === 0 ? (
            <TableRow>
              <EmptyTableRow columns={COLUMNS} text="No invoices yet" />
            </TableRow>
          ) : (
            invoices.map((inv) => (
              <TableRow key={inv.invoice_number}>
                <TableCell>{inv.invoice_number}</TableCell>
                <TableCell>{formatBillingDate(inv.created_at)}</TableCell>
                <TableCell className="capitalize">
                  {inv.billing_reason
                    ? inv.billing_reason.replace(/_/g, " ")
                    : "—"}
                </TableCell>
                <TableCell>
                  {formatBillingDate(inv.period_start)} →{" "}
                  {formatBillingDate(inv.period_end)}
                </TableCell>
                <TableCell>
                  {formatCents(inv.total_cents, inv.currency)}
                </TableCell>
                <TableCell>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      INVOICE_STATUS_STYLES[inv.status],
                    )}
                  >
                    {inv.status}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {inv.hosted_invoice_url && (
                      <a
                        href={inv.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View invoice on Stripe"
                        className="text-subTextColor dark:text-darkTextSecondary hover:text-headingTextColor dark:hover:text-darkTextPrimary"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    {inv.invoice_pdf && (
                      <a
                        href={inv.invoice_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Download PDF"
                        className="text-subTextColor dark:text-darkTextSecondary hover:text-headingTextColor dark:hover:text-darkTextPrimary"
                      >
                        <FileText className="h-4 w-4" />
                      </a>
                    )}
                    {!inv.hosted_invoice_url && !inv.invoice_pdf && (
                      <span className="text-subTextColor dark:text-darkTextSecondary">
                        —
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline2"
            size="sm"
            disabled={loading || page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="outline2"
            size="sm"
            disabled={loading || page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
