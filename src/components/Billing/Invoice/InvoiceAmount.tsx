import { cn } from "@/lib/utils";
import { formatInvoiceMoney } from "@/lib/invoice";

/**
 * The money render boundary. `cents` is required and non-nullable on purpose:
 * the guide says to omit a row rather than print a placeholder in a money
 * column, so the decision belongs to the caller — not to a fallback in here.
 */
export default function InvoiceAmount({
  cents,
  currency,
  emphasis = false,
  className,
}: {
  cents: number;
  currency: string;
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "tabular-nums whitespace-nowrap",
        emphasis && "font-semibold",
        className,
      )}
    >
      {formatInvoiceMoney(cents, currency)}
    </span>
  );
}
