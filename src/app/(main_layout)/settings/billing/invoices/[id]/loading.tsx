import InvoiceDocumentSkeleton from "@/components/Billing/Invoice/InvoiceDocumentSkeleton";

/**
 * The detail read is uncached and can sit behind Stripe, so the route streams a
 * document-shaped skeleton instead of a blank frame.
 */
const InvoiceDetailLoading = () => (
  <div>
    <div className="mb-5 h-14 w-64 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
    <InvoiceDocumentSkeleton />
  </div>
);

export default InvoiceDetailLoading;
