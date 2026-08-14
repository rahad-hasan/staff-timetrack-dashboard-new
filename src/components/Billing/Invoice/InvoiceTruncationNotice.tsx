import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";

import { DOC } from "./invoiceDocumentTheme";

/**
 * `lines_truncated === true` — Stripe holds more lines than the backend
 * snapshots (cap 20), so the lines shown sum to LESS than `subtotal_cents`.
 * The note exists so the shortfall reads as "not the full list" instead of "the
 * arithmetic is wrong", and it points at the authoritative Stripe copy.
 */
export default function InvoiceTruncationNotice({
  shownCount,
  hostedInvoiceUrl,
}: {
  shownCount: number;
  hostedInvoiceUrl: string | null;
}) {
  return (
    <div className={cn("mt-3 rounded-md border px-3 py-2 text-sm", DOC.rule, DOC.body)}>
      <p>
        Showing the first {shownCount} items — this invoice has more, so the
        lines above do not add up to the subtotal. The totals below are complete.
      </p>
      {hostedInvoiceUrl && (
        <a
          href={hostedInvoiceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "mt-1 inline-flex items-center gap-1 font-medium underline underline-offset-2 print:hidden",
            DOC.accent,
          )}
        >
          See the full invoice
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
