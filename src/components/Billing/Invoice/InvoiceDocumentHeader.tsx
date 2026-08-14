import Image from "next/image";

import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import { invoiceProductName } from "@/lib/invoice";
import { IBillingInvoiceDetail } from "@/types/billing";

import InvoiceStatusBadge from "./InvoiceStatusBadge";
import { DOC } from "./invoiceDocumentTheme";

/**
 * Document masthead: the word "Invoice" on the left, our brand on the right.
 * The product name comes from `seller.product_name` (env-configured
 * server-side) — only the logo is a client asset.
 *
 * No status chip in the normal case: the reference document carries none, and
 * the totals ladder already says what is owed. The one exception is a voided
 * invoice, which the guide requires to be badged and which nothing else on the
 * page would otherwise reveal.
 */
export default function InvoiceDocumentHeader({
  invoice,
}: {
  invoice: IBillingInvoiceDetail;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <h2 className={cn("text-2xl font-bold", DOC.heading)}>Invoice</h2>
        {invoice.voided && <InvoiceStatusBadge invoice={invoice} surface="document" />}
      </div>

      <div className="flex items-center gap-2">
        <Image src={logo} alt="" aria-hidden width={20} height={27} className="h-6 w-auto" />
        {/* Dark wordmark beside a coloured mark, as in the reference — the logo
            carries the brand colour, the text does not. */}
        <span className={cn("text-base font-semibold", DOC.heading)}>
          {invoiceProductName(invoice.seller)}
        </span>
      </div>
    </header>
  );
}
