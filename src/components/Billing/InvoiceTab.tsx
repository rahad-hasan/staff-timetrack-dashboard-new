"use client";

import InvoiceHistoryTable from "@/components/Billing/InvoiceHistoryTable";

/**
 * The "Invoice" tab body.
 *
 * Deliberately thin: `InvoiceHistoryTable` (and the row, the fetch hook, the
 * invoice document and the PDF kit behind it) already works end to end,
 * self-heals page 1 from Stripe and owns its own paging. Moving that flow into
 * a tab is a layout change, so this adds the section heading the design shows
 * and nothing else — the table keeps its own data, its own errors and its own
 * "No invoices yet" state.
 */
export default function InvoiceTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-headingTextColor sm:text-2xl dark:text-darkTextPrimary">
          Invoice History
        </h2>
        <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
          Track and download every invoice and receipt for your workspace.
        </p>
      </div>

      <InvoiceHistoryTable />
    </div>
  );
}
