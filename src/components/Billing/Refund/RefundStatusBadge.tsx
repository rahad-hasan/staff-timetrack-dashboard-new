import { cn } from "@/lib/utils";
import { REFUND_STATUS_LABELS, REFUND_STATUS_STYLES } from "@/lib/refund";
import type { TRefundStatus } from "@/types/billing";

export const RefundStatusBadge = ({
  status,
  className,
}: {
  status: TRefundStatus;
  className?: string;
}) => (
  <span
    className={cn(
      "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
      REFUND_STATUS_STYLES[status],
      className,
    )}
  >
    {REFUND_STATUS_LABELS[status]}
  </span>
);
