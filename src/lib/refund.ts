import type {
  IRefundEligibility,
  TRefundBlockedReason,
  TRefundReason,
  TRefundStatus,
} from "@/types/billing";

/** Customer-facing words: "failed" is an internal state the team is working on. */
export const REFUND_STATUS_LABELS: Record<TRefundStatus, string> = {
  pending: "In review",
  approved: "Approved",
  processing: "Processing",
  processed: "Refunded",
  rejected: "Declined",
  failed: "Delayed",
  canceled: "Withdrawn",
};

export const REFUND_STATUS_STYLES: Record<TRefundStatus, string> = {
  pending: "bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  approved: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  processing: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  processed: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300",
  rejected: "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-300",
  failed: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  canceled: "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-300",
};

export const REFUND_REASON_LABELS: Record<TRefundReason, string> = {
  duplicate_charge: "I was charged twice",
  service_issue: "The service did not work as expected",
  billing_error: "I was billed the wrong amount",
  plan_change: "I changed or cancelled my plan",
  other: "Something else",
};

export const REFUND_REASON_VALUES = [
  "duplicate_charge",
  "service_issue",
  "billing_error",
  "plan_change",
  "other",
] as const satisfies readonly TRefundReason[];

export const REFUND_BLOCKED_COPY: Record<
  TRefundBlockedReason,
  (eligibility: IRefundEligibility) => string
> = {
  not_paid: () => "Only paid invoices can be refunded.",
  fully_refunded: () => "This invoice has already been fully refunded.",
  request_open: () =>
    "A refund request for this invoice is already being reviewed. You can follow it under Billing → Refunds.",
  window_expired: (eligibility) =>
    `Refunds can be requested within ${eligibility.request_window_days} days of payment. Please contact support about older invoices.`,
};

/** Matches what the amount field accepts: digits, optionally up to two decimals. */
export const REFUND_AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

/**
 * "12.3" → 1230, without floating-point drift (`12.3 * 100` is 1230.0000000000002).
 * Callers validate against REFUND_AMOUNT_PATTERN first; anything else is NaN.
 */
export const dollarsToCents = (value: string): number => {
  const trimmed = value.trim();
  if (!REFUND_AMOUNT_PATTERN.test(trimmed)) return Number.NaN;
  const [whole, fraction = ""] = trimmed.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
};
