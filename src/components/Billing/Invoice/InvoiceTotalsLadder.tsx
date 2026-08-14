import { cn } from "@/lib/utils";
import { buildTotalsLadder } from "@/lib/invoice";
import { IInvoiceTotals } from "@/types/billing";

import InvoiceAmount from "./InvoiceAmount";
import { DOC } from "./invoiceDocumentTheme";

/**
 * The reconciling ladder: the right half of the document, one rule above every
 * row. Every figure comes from `totals` — the lines are pre-discount and
 * pre-tax and must never be summed into a total.
 *
 * `break-inside-avoid` keeps the ladder whole across a page break, which the
 * guide calls out explicitly for multi-page invoices.
 */
export default function InvoiceTotalsLadder({
  totals,
  currency,
  voided = false,
}: {
  totals: IInvoiceTotals;
  currency: string;
  voided?: boolean;
}) {
  const rows = buildTotalsLadder(totals, { voided });

  return (
    <div className="flex break-inside-avoid justify-end">
      <dl className={cn("w-full text-sm/[1.65] sm:w-1/2", DOC.heading)}>
        {rows.map((row) => (
          <div
            key={row.key}
            className={cn(
              "flex items-baseline justify-between gap-6 border-t py-2.5",
              DOC.rule,
            )}
          >
            <dt className={row.tone === "strong" ? "font-semibold" : undefined}>
              {row.label}
            </dt>
            <dd className={cn(row.tone === "credit" && DOC.credit)}>
              <InvoiceAmount
                cents={row.cents}
                currency={currency}
                emphasis={row.tone === "strong"}
              />
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
