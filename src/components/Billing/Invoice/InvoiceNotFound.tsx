import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { BILLING_URL } from "@/lib/billing";

/**
 * 400 and 404 land here. The backend scopes invoices to the caller's company,
 * so "another company's invoice" and "no such invoice" are indistinguishable by
 * design — and the copy must not hint that the id exists elsewhere.
 */
export default function InvoiceNotFound() {
  return (
    <div className="rounded-lg border border-borderColor bg-white p-8 text-center dark:border-darkBorder dark:bg-darkPrimaryBg">
      <FileQuestion className="mx-auto h-10 w-10 text-subTextColor dark:text-darkTextSecondary" />
      <h3 className="mt-3 text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">
        Invoice not found
      </h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-subTextColor dark:text-darkTextSecondary">
        This invoice doesn&apos;t exist or isn&apos;t part of your workspace&apos;s
        billing history.
      </p>
      <Link
        href={BILLING_URL}
        className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4"
      >
        Back to Billing &amp; Plans
      </Link>
    </div>
  );
}
