export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { getBillingInvoiceDetailWithRetry } from "@/actions/billing/action";
import { BILLING_URL } from "@/lib/billing";
import { parseInvoiceRouteId } from "@/lib/invoice";
import { getDecodedUser } from "@/utils/decodedLogInUser";

import HeadingComponent from "@/components/Common/HeadingComponent";
import InvoiceActionsBar from "@/components/Billing/Invoice/InvoiceActionsBar";
import InvoiceDocument from "@/components/Billing/Invoice/InvoiceDocument";
import InvoiceNotFound from "@/components/Billing/Invoice/InvoiceNotFound";
import InvoiceRetryPanel from "@/components/Billing/Invoice/InvoiceRetryPanel";

export const metadata: Metadata = {
  title: "Invoice",
  description: "View, print and download a billing invoice",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * `/settings/billing/invoices/:id` — the invoice document.
 *
 * Role gate mirrors the billing page (admin / manager / hr); the endpoint is
 * tenant-scoped server-side, so there is no company check to repeat here.
 * Error handling follows guide §6: 400/404 → "Invoice not found", 402 → the
 * existing lockout flow, 5xx → one silent retry (in the action) then a retry
 * button rather than a half-empty document.
 */
const InvoiceDetailPage = async ({ params }: PageProps) => {
  const [{ id: rawId }, currentUser] = await Promise.all([
    params,
    getDecodedUser(),
  ]);

  const role = currentUser?.role ?? "";
  if (!["admin", "manager", "hr"].includes(role)) redirect("/settings");

  const backLink = (
    <Link
      href={BILLING_URL}
      className="mt-3 inline-flex items-center gap-1 text-sm text-subTextColor hover:text-headingTextColor sm:mt-0 dark:text-darkTextSecondary dark:hover:text-darkTextPrimary"
    >
      <ChevronLeft size={16} />
      Back to Billing
    </Link>
  );

  const header = (
    <div className="mb-2 flex flex-col sm:mb-5 sm:flex-row sm:items-center sm:justify-between print:hidden">
      <HeadingComponent
        heading="Invoice"
        subHeading="View the full document, print it, or download a copy"
      />
      {backLink}
    </div>
  );

  // A non-numeric or out-of-range id is a 400 at the API — the guide says to
  // treat it as not found, so it never reaches the network.
  const invoiceId = parseInvoiceRouteId(rawId);
  if (invoiceId === null) {
    return (
      <div>
        {header}
        <InvoiceNotFound />
      </div>
    );
  }

  const response = await getBillingInvoiceDetailWithRetry(invoiceId);

  if (!response?.success || !response.data) {
    const statusCode = response?.statusCode;

    // Workspace locked by the entitlement gate — hand off to the billing page,
    // which owns the lockout UI. (GETs don't auto-redirect in baseApi.)
    if (statusCode === 402) {
      const message = response?.message ?? "";
      redirect(
        `${BILLING_URL}${message ? `?blocked=${encodeURIComponent(message)}` : ""}`,
      );
    }

    const notFound = statusCode === 400 || statusCode === 404;
    return (
      <div>
        {header}
        {notFound ? (
          <InvoiceNotFound />
        ) : (
          <InvoiceRetryPanel message={response?.message} />
        )}
      </div>
    );
  }

  const invoice = response.data;

  return (
    <div>
      <div className="mb-2 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <HeadingComponent
          heading="Invoice"
          subHeading={`${invoice.invoice_number} · view, print or download this document`}
        />
        {backLink}
      </div>

      <div className="mb-4 print:hidden">
        <InvoiceActionsBar invoice={invoice} />
      </div>

      <InvoiceDocument invoice={invoice} />
    </div>
  );
};

export default InvoiceDetailPage;
