import { cn } from "@/lib/utils";

import { DOC } from "./invoiceDocumentTheme";

/**
 * One address column — the seller on the left, "Bill to" on the right.
 *
 * The seller column has no heading, so its (bold) name shares the first line
 * with the "Bill to" heading opposite it and the bill-to name sits one line
 * lower. That is the reference layout, and it is why `name` is bold only when
 * there is no title above it.
 *
 * `lines` is filtered here so callers can pass nullable fields straight through
 * (`bill_to.address`, `bill_to.email`, `seller.phone` are all nullable) without
 * each one repeating the same guard.
 */
export default function InvoicePartyBlock({
  title,
  name,
  lines = [],
}: {
  title?: string;
  name: string;
  lines?: Array<string | null | undefined>;
}) {
  const visible = lines
    .map((line) => line?.trim())
    .filter((line): line is string => !!line);

  return (
    <div className={cn("min-w-0 text-sm/[1.65]", DOC.heading)}>
      {title && <p className="font-semibold">{title}</p>}
      <p className={cn("wrap-break-word", !title && "font-semibold")}>{name}</p>
      {visible.map((line, index) => (
        <p key={`${line}-${index}`} className="wrap-break-word">
          {line}
        </p>
      ))}
    </div>
  );
}
