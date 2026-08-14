"use client";

import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

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

import InvoiceHistoryRow from "./Invoice/InvoiceHistoryRow";
import { useInvoiceHistory } from "./Invoice/useInvoiceHistory";

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
 * Invoice history. The list endpoint self-heals — page 1 can trigger a one-off
 * Stripe reconciliation when history looks empty or behind — so this table
 * holds a skeleton for as long as the request takes and only ever shows "No
 * invoices yet" once the server has actually answered with an empty page.
 */
export default function InvoiceHistoryTable() {
  const { page, setPage, invoices, totalPages, loading, slow, error, retry } =
    useInvoiceHistory(LIMIT);

  return (
    <div className="rounded-lg border border-borderColor bg-white p-3 sm:p-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
      <h3 className="mb-1 text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">
        Invoice history
      </h3>
      <p className="mb-4 text-sm text-subTextColor dark:text-darkTextSecondary">
        Every charge on your subscription, with our invoice document plus
        Stripe-hosted receipts and PDFs.
      </p>

      {error && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
          <span>{error}</span>
          <Button type="button" variant="outline2" size="sm" onClick={retry}>
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 4 }).map((_, row) => (
              <TableRow key={`skeleton-${row}`}>
                {COLUMNS.map((column) => (
                  <TableCell key={column}>
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
            invoices.map((invoice) => (
              <InvoiceHistoryRow
                // `invoice_number` is unique per company and stable; ids are
                // absent on payloads that predate the detail endpoint.
                key={invoice.id ?? invoice.invoice_number}
                invoice={invoice}
              />
            ))
          )}
        </TableBody>
      </Table>

      {loading && slow && (
        <p className="mt-3 text-sm text-subTextColor dark:text-darkTextSecondary">
          Syncing your invoice history from Stripe — this can take a few seconds
          the first time.
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline2"
            size="sm"
            disabled={loading || page <= 1}
            onClick={() => setPage(Math.max(1, page - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>
          <Button
            variant="outline2"
            size="sm"
            disabled={loading || page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
