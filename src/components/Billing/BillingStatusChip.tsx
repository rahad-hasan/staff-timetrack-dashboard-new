"use client";

import { BillingStatusValue } from "@/types/billing";
import { STATUS_CHIP_STYLES, STATUS_LABELS } from "@/lib/billing";
import { cn } from "@/lib/utils";

/**
 * Small rounded billing-status chip (contract §1). Label/classes come straight
 * from the lib/billing maps; `null` (legacy company, no subscription) renders
 * a gray "No subscription" chip.
 */
export default function BillingStatusChip({
  status,
}: {
  status: BillingStatusValue | null;
}) {
  const label = status ? STATUS_LABELS[status] : "No subscription";
  const styles = status
    ? STATUS_CHIP_STYLES[status]
    : "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-300";

  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles,
      )}
    >
      {label}
    </span>
  );
}
