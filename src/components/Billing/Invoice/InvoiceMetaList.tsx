import { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { DOC } from "./invoiceDocumentTheme";

export interface InvoiceMetaItem {
  label: string;
  /** Null/empty drops the whole row — never render "—" in the document head. */
  value: ReactNode | null | undefined;
}

/**
 * The label/value stack under the document title (invoice number, date of
 * issue, date due, transaction date). Rows with no value are dropped rather
 * than printed empty — `transaction_date` is null on every unpaid invoice.
 *
 * Only the first label is bold, matching the reference document.
 */
export default function InvoiceMetaList({ items }: { items: InvoiceMetaItem[] }) {
  const visible = items.filter(
    (item) => item.value !== null && item.value !== undefined && item.value !== "",
  );
  if (!visible.length) return null;

  return (
    <dl
      className={cn(
        "grid grid-cols-[minmax(7.5rem,auto)_1fr] gap-x-4 text-sm/[1.65]",
        DOC.heading,
      )}
    >
      {visible.map((item, index) => (
        <div key={item.label} className="contents">
          <dt className={index === 0 ? "font-semibold" : undefined}>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
