import { cn } from "@/lib/utils";
import { formatInvoiceDate } from "@/lib/invoice";
import { IBillingInvoiceDetail } from "@/types/billing";

import InvoiceDocumentHeader from "./InvoiceDocumentHeader";
import InvoiceLinesTable from "./InvoiceLinesTable";
import InvoiceMetaList from "./InvoiceMetaList";
import InvoicePartyBlock from "./InvoicePartyBlock";
import InvoiceTotalsLadder from "./InvoiceTotalsLadder";
import InvoiceTruncationNotice from "./InvoiceTruncationNotice";
import { DOC } from "./invoiceDocumentTheme";

/**
 * The printable invoice document (guide §5), composed from the small blocks
 * beside it so a layout tweak lands in one file. It mirrors the PDF exporter
 * section for section — same order, same splits, same rules — so what the user
 * sees here is what "Download PDF" and "Print" produce.
 *
 * It renders as paper — fixed light palette in both themes — so the on-screen
 * copy, the printed copy and the PDF cannot drift apart.
 *
 * `id="invoice-print-area"` is the anchor the print stylesheet in globals.css
 * keys off: everything outside it is removed when the page is printed, which is
 * how "Print / Save as PDF" yields a correct document in any writing system the
 * browser can render.
 */
export default function InvoiceDocument({
  invoice,
}: {
  invoice: IBillingInvoiceDetail;
}) {
  const { seller, bill_to: billTo, totals, lines } = invoice;

  // `date_of_issue` — NOT `created_at` — is the printed issue date.
  const meta = [
    { label: "Invoice number", value: invoice.invoice_number },
    { label: "Date of issue", value: formatInvoiceDate(invoice.date_of_issue) },
    { label: "Date due", value: formatInvoiceDate(invoice.date_due) },
    // Null on every unpaid invoice — InvoiceMetaList drops the row.
    { label: "Transaction date", value: formatInvoiceDate(invoice.transaction_date) },
  ];

  return (
    <article
      id="invoice-print-area"
      className={cn(
        "rounded-lg border p-4 sm:p-8 print:rounded-none print:border-0 print:p-0",
        DOC.paper,
        DOC.rule,
      )}
    >
      <InvoiceDocumentHeader invoice={invoice} />

      <div className="mt-5">
        <InvoiceMetaList items={meta} />
      </div>

      {/* Half and half: the "Bill to" column starts on the same x as the
          Quantity column and the totals ladder below it. */}
      <div className="mt-7 grid gap-6 sm:grid-cols-2">
        <InvoicePartyBlock
          name={seller?.name ?? ""}
          lines={[...(seller?.address_lines ?? []), seller?.phone, seller?.support_email]}
        />
        <InvoicePartyBlock
          title="Bill to"
          name={
            billTo?.company_id
              ? `${billTo.name} (ID: ${billTo.company_id})`
              : (billTo?.name ?? "")
          }
          lines={[billTo?.address, billTo?.email]}
        />
      </div>

      <div className="mt-9">
        <InvoiceLinesTable lines={lines ?? []} planName={invoice.plan_name} />

        {invoice.lines_truncated && (
          <InvoiceTruncationNotice
            shownCount={lines?.length ?? 0}
            hostedInvoiceUrl={invoice.hosted_invoice_url}
          />
        )}
      </div>

      <InvoiceTotalsLadder
        totals={totals}
        currency={invoice.currency}
        voided={invoice.voided}
      />

      {invoice.voided && (
        <p className={cn("mt-8 text-xs", DOC.faint)}>
          This invoice has been voided and nothing is owed on it.
        </p>
      )}
    </article>
  );
}
