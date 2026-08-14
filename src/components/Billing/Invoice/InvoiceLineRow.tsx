import { cn } from "@/lib/utils";
import { formatLinePeriod, isCreditLine, lineDescription } from "@/lib/invoice";
import { IInvoiceLine } from "@/types/billing";

import InvoiceAmount from "./InvoiceAmount";
import { DOC } from "./invoiceDocumentTheme";

/**
 * One line of the itemisation: a bold description with its service period
 * beneath, then quantity, unit price and the line total.
 *
 * `amount_cents` is the ONLY total printed: on a proration line
 * `quantity × unit_amount_cents` does not equal it, and it can be negative.
 * Quantity and unit price are printed when Stripe sent them and left blank when
 * it didn't — a money column never carries a placeholder.
 *
 * The numeric columns are vertically centred against the two-line description,
 * as in the reference document; the description itself is top-aligned.
 */
export default function InvoiceLineRow({
  line,
  planName,
  isLast,
}: {
  line: IInvoiceLine;
  planName: string | null | undefined;
  isLast: boolean;
}) {
  const period = formatLinePeriod(line);
  const credit = isCreditLine(line);
  // The final row is left open — the totals ladder's own top rule closes the
  // table, and it spans only the right half.
  const border = isLast ? "" : cn("border-b", DOC.rule);

  return (
    <tr className={border}>
      <td className={cn("py-3 pr-6 align-top", DOC.heading)}>
        <span className="font-semibold wrap-break-word">
          {lineDescription(line, planName)}
        </span>
        {(period || line.proration) && (
          <p className={cn("text-sm", DOC.muted)}>
            {[period, line.proration ? "Proration" : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
      </td>

      <td className={cn("py-3 pr-3 align-middle tabular-nums", DOC.heading)}>
        {line.quantity ?? ""}
      </td>

      <td className={cn("py-3 pr-3 align-middle", DOC.heading)}>
        {line.unit_amount_cents === null || line.unit_amount_cents === undefined ? (
          ""
        ) : (
          <InvoiceAmount cents={line.unit_amount_cents} currency={line.currency} />
        )}
      </td>

      <td
        className={cn(
          "py-3 text-right align-middle",
          credit ? DOC.credit : DOC.heading,
        )}
      >
        <InvoiceAmount cents={line.amount_cents} currency={line.currency} />
      </td>
    </tr>
  );
}
