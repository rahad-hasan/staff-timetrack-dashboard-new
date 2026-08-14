import { cn } from "@/lib/utils";
import { getInvoiceBadge, type InvoiceBadgeSurface } from "@/lib/invoice";
import { IBillingInvoice } from "@/types/billing";

/**
 * The invoice state chip. Deliberately takes the whole invoice rather than a
 * status string so no caller can render `status` on its own — a voided invoice
 * carries `status: "refunded"` and must badge as `Voided`.
 *
 * `surface="document"` drops the dark-mode colours: the invoice document is
 * fixed-light paper in both themes so that screen, print and PDF agree.
 */
export default function InvoiceStatusBadge({
  invoice,
  surface = "app",
  className,
}: {
  invoice: Pick<IBillingInvoice, "status" | "voided">;
  surface?: InvoiceBadgeSurface;
  className?: string;
}) {
  const badge = getInvoiceBadge(invoice, surface);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        badge.className,
        className,
      )}
    >
      {badge.label}
    </span>
  );
}
