"use client";

import { useState } from "react";
import { Download, ExternalLink, FileText, Loader2, Printer, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { IBillingInvoiceDetail } from "@/types/billing";
import dynamic from "next/dynamic";
import { loadOrReload } from "@/lib/lazyChunk";
import { useLatched } from "@/lib/onboarding/useLatched";
import { StandaloneDialogChunkPlaceholder } from "@/components/Common/DialogChunkPlaceholder";

// The refund form (zod, react-hook-form, Radix Select) was nine tenths of this
// page's own JavaScript although only an admin on a paid invoice can open it.
// Its own chunk now, fetched on first open; hovering or focusing "Request
// refund" starts the download and the placeholder covers a click that beats it.
const importRequestRefundDialog = () => import("../Refund/RequestRefundDialog");
const loadRequestRefundDialog = loadOrReload(importRequestRefundDialog);
const RequestRefundDialog = dynamic(loadRequestRefundDialog, {
  ssr: false,
  loading: () => (
    <StandaloneDialogChunkPlaceholder
      title="Request a refund"
      className="w-full max-w-[calc(100vw-1rem)] sm:max-w-[520px] dark:bg-darkSecondaryBg"
    />
  ),
});

// The raw import, never the loader above: a warm-up must not reload the page.
const warmRequestRefundDialog = () => {
  importRequestRefundDialog().catch(() => {});
};

/**
 * Everything the user can do with an invoice document.
 *
 * Two export routes, on purpose:
 *   • "Download PDF" builds the document with jsPDF — vector text, our
 *     branding, page numbers on every page.
 *   • "Print" hands the same DOM to the browser, which renders every script
 *     natively; it is the guaranteed-correct path for any writing system and
 *     the fallback we point at if the PDF builder had to degrade.
 *
 * Stripe's own copies are surfaced alongside them: they are authoritative and
 * cost nothing to link.
 */
export default function InvoiceActionsBar({
  invoice,
  canRequestRefund = false,
}: {
  invoice: IBillingInvoiceDetail;
  /** Admin viewing a paid invoice: the server re-checks both. */
  canRequestRefund?: boolean;
}) {
  const [building, setBuilding] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  // Mounted with the first open and kept from then on, as when it shipped
  // with the page: it reloads eligibility each time it opens, and staying
  // mounted keeps its close animation.
  const refundDialogMounted = useLatched(refundOpen);

  const handleDownload = async () => {
    if (building) return;
    setBuilding(true);
    try {
      // ~350kB of jspdf + autotable stays out of the billing bundle until asked for.
      const { downloadInvoicePdf } = await import("./pdf/invoicePdfDocument");
      const { unicodeDegraded } = await downloadInvoicePdf(invoice);
      if (unicodeDegraded) {
        toast.warning(
          "Some characters in this invoice could not be embedded. Use Print → Save as PDF for an exact copy.",
        );
      } else {
        toast.success("Invoice downloaded.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to build the invoice PDF.",
      );
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <Button type="button" onClick={handleDownload} disabled={building}>
        {building ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {building ? "Preparing…" : "Download PDF"}
      </Button>

      <Button type="button" variant="outline2" onClick={() => window.print()}>
        <Printer className="h-4 w-4" />
        Print
      </Button>

      {invoice.hosted_invoice_url && (
        <Button variant="outline2" asChild>
          <a
            href={invoice.hosted_invoice_url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            View receipt
          </a>
        </Button>
      )}

      {invoice.invoice_pdf && (
        <Button variant="outline2" asChild>
          <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer">
            <FileText className="h-4 w-4" />
            Stripe PDF
          </a>
        </Button>
      )}

      {canRequestRefund && (
        <>
          <Button
            type="button"
            variant="outline2"
            onClick={() => setRefundOpen(true)}
            onPointerEnter={warmRequestRefundDialog}
            onFocus={warmRequestRefundDialog}
          >
            <Undo2 className="h-4 w-4" />
            Request refund
          </Button>
          {refundDialogMounted ? (
            <RequestRefundDialog
              open={refundOpen}
              onOpenChange={setRefundOpen}
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoice_number}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
