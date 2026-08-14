import { cn } from "@/lib/utils";
import { IInvoiceLine } from "@/types/billing";

import InvoiceLineRow from "./InvoiceLineRow";
import { DOC } from "./invoiceDocumentTheme";

/**
 * The itemisation. A real `<thead>` is used rather than a styled div grid so
 * the browser repeats the column header on every page of a printed document —
 * the guide's multi-page requirement.
 *
 * The description column takes half the width; Quantity, Unit price and Total
 * share the other half, which is also where the totals ladder sits.
 */
export default function InvoiceLinesTable({
  lines,
  planName,
}: {
  lines: IInvoiceLine[];
  planName: string | null | undefined;
}) {
  if (!lines.length) {
    return (
      <p className={cn("py-6 text-sm", DOC.muted)}>
        This invoice has no itemised lines. The totals below are still complete.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto print:overflow-visible">
      <table
        className={cn(
          "w-full min-w-130 border-collapse text-sm/[1.65] print:min-w-0",
          DOC.heading,
        )}
      >
        <colgroup>
          <col className="w-1/2" />
          <col className="w-[17%]" />
          <col className="w-[16%]" />
          <col className="w-[17%]" />
        </colgroup>
        <thead className="table-header-group">
          <tr className={cn("border-b", DOC.rule)}>
            <th className="py-2 pr-6 text-left font-semibold">Description</th>
            <th className="py-2 pr-3 text-left font-semibold">Quantity</th>
            <th className="py-2 pr-3 text-left font-semibold">Unit price</th>
            <th className="py-2 text-right font-semibold">Total</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line, index) => (
            <InvoiceLineRow
              // Stripe line ids aren't in the snapshot; position is stable for a
              // settled invoice and the list is never reordered client-side.
              key={`${index}-${line.description ?? "line"}-${line.amount_cents}`}
              line={line}
              planName={planName}
              isLast={index === lines.length - 1}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
