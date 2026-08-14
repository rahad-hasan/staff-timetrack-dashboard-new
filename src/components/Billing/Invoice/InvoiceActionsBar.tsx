"use client";

import { useState } from "react";
import { Download, ExternalLink, FileText, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { IBillingInvoiceDetail } from "@/types/billing";

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
}: {
  invoice: IBillingInvoiceDetail;
}) {
  const [building, setBuilding] = useState(false);

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
    </div>
  );
}
