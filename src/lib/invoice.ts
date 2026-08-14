import { format } from "date-fns";

import {
  IBillingInvoice,
  IBillingInvoiceDetail,
  IInvoiceLine,
  IInvoiceSeller,
  IInvoiceTotals,
} from "@/types/billing";
import { INVOICE_STATUS_STYLES, formatCents } from "@/lib/billing";

/**
 * Invoice display + derivation helpers (docs/frontend-invoice-integration.md).
 *
 * Two rules are load-bearing and every helper below exists to keep callers from
 * breaking them:
 *   1. `voided` is checked BEFORE `status` — Stripe maps `void` → `refunded`,
 *      so a voided invoice that is not owed would otherwise badge as a refund
 *      and keep its "Pay now" button.
 *   2. Money is never derived. `*_cents` values are printed as received and
 *      divided by 100 only at the render boundary; the totals ladder is read
 *      from `totals`, never summed from `lines`.
 */

/* ---------------- status badge ---------------- */

export interface InvoiceBadge {
  label: string;
  className: string;
}

const STATUS_BADGE_LABELS: Record<string, string> = {
  paid: "Paid",
  pending: "Pending",
  unpaid: "Unpaid",
  failed: "Failed",
  refunded: "Refunded",
};

const NEUTRAL_APP_CHIP = "bg-gray-100 text-gray-600 dark:bg-gray-500/15 dark:text-gray-300";
const NEUTRAL_DOC_CHIP = "bg-gray-100 text-gray-600";

/**
 * Light-only chip styles for the document surface. The invoice document is
 * paper — fixed white background in both themes — so it must not inherit the
 * dark-mode chip colours (pale text on white is unreadable).
 */
const DOCUMENT_STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-50 text-green-700",
  pending: "bg-orange-50 text-orange-700",
  unpaid: "bg-orange-50 text-orange-700",
  failed: "bg-red-50 text-red-700",
  refunded: NEUTRAL_DOC_CHIP,
};

/**
 * Where the chip is being rendered: `app` follows the dashboard theme, `document`
 * is fixed-light so it matches the printed and exported copies.
 */
export type InvoiceBadgeSurface = "app" | "document";

/**
 * The one place the badge is decided. `voided` wins over `status` — see rule 1.
 * Unknown statuses fall through to a neutral chip rather than crashing on a
 * missing style key, so a new backend status can ship before the frontend does.
 */
export const getInvoiceBadge = (
  invoice: Pick<IBillingInvoice, "status" | "voided">,
  surface: InvoiceBadgeSurface = "app",
): InvoiceBadge => {
  const neutral = surface === "document" ? NEUTRAL_DOC_CHIP : NEUTRAL_APP_CHIP;
  const styles =
    surface === "document" ? DOCUMENT_STATUS_STYLES : INVOICE_STATUS_STYLES;

  // Voided is a state of its own, not an invoice status — hence its own chip.
  if (invoice.voided) return { label: "Voided", className: neutral };

  return {
    label: STATUS_BADGE_LABELS[invoice.status] ?? invoice.status,
    className: styles[invoice.status] ?? neutral,
  };
};

/**
 * Whether a "Pay now" affordance may be shown. A voided invoice is not owed
 * even though Stripe reports it as `refunded` with a historical balance.
 */
export const isInvoicePayable = (invoice: IBillingInvoice): boolean =>
  !invoice.voided &&
  invoice.status !== "paid" &&
  (invoice.amount_due_cents ?? 0) > 0 &&
  !!invoice.hosted_invoice_url;

/* ---------------- branding ---------------- */

/**
 * Our product name, as it appears everywhere else in the app (page titles,
 * `app/layout.tsx`). This is OUR branding, not part of the seller block the
 * guide tells us never to hardcode.
 */
export const PRODUCT_NAME = "Staff Time Tracker";

/**
 * The wordmark printed in the document's top-right corner.
 *
 * `seller.product_name` is env-configured server-side and wins whenever it is
 * set (guide §5). It falls back to our own product name — never to
 * `seller.name`, which is the legal entity ("Orbit Technology") and belongs in
 * the address block, and never to a generic word, which would print "Invoice"
 * twice across the masthead.
 */
export const invoiceProductName = (
  seller: IInvoiceSeller | null | undefined,
): string => seller?.product_name?.trim() || PRODUCT_NAME;

/* ---------------- detail addressing ---------------- */

/** Trailing numeric segment of `detail_path` — the id the detail route wants. */
const idFromDetailPath = (path: string | undefined): number | null => {
  if (!path) return null;
  // Tolerate a query string and a trailing slash before the id segment.
  const match = /(\d+)\/*\s*$/.exec(path.split("?")[0].trim());
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

/**
 * The row's own id, preferring `detail_path` as the guide asks ("use it instead
 * of building the URL yourself") and falling back to `id` for the status
 * snapshot, which carries neither field on older payloads.
 */
export const getInvoiceId = (invoice: IBillingInvoice): number | null =>
  idFromDetailPath(invoice.detail_path) ??
  (Number.isSafeInteger(invoice.id) && (invoice.id ?? 0) > 0
    ? (invoice.id as number)
    : null);

/** In-app route for the invoice document, or null when the row can't address one. */
export const invoiceDetailHref = (invoice: IBillingInvoice): string | null => {
  const id = getInvoiceId(invoice);
  return id === null ? null : `/settings/billing/invoices/${id}`;
};

/** Route param → id. Rejects `"12abc"`, `"-1"`, `"1.5"` and overflow alike. */
export const parseInvoiceRouteId = (raw: string | undefined): number | null => {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

/* ---------------- dates ---------------- */

/** ISO → "Aug 1, 2026". Null/unparseable collapses to null so callers can omit. */
export const formatInvoiceDate = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : format(date, "MMM d, yyyy");
};

/**
 * `lines[].period_*` are EPOCH SECONDS while every top-level date is ISO. The
 * asymmetry is deliberate (line periods come straight from Stripe) and this is
 * the only function allowed to know about it.
 */
export const formatLineEpoch = (seconds: number | null | undefined): string | null => {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
    return null;
  }
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? null : format(date, "MMM d, yyyy");
};

/**
 * "Aug 1, 2026 - Sep 1, 2026" for a line's service period, or null when Stripe
 * sent neither bound. A plain hyphen, matching the reference invoice layout —
 * and safe in the PDF, unlike an arrow, which jsPDF's WinAnsi core font would
 * render as garbage.
 */
export const formatLinePeriod = (line: IInvoiceLine): string | null => {
  const start = formatLineEpoch(line.period_start);
  const end = formatLineEpoch(line.period_end);
  if (start && end) return start === end ? start : `${start} - ${end}`;
  return start ?? end;
};

/** `subscription_cycle` → "Subscription cycle". */
export const formatBillingReason = (
  reason: string | null | undefined,
): string | null => {
  if (!reason) return null;
  const spaced = reason.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

/* ---------------- lines ---------------- */

/**
 * What to print in the description column. Stripe leaves `description` null on
 * some proration and metered lines; the plan name is the only other truthful
 * label we hold, so it stands in rather than an empty cell.
 */
export const lineDescription = (
  line: IInvoiceLine,
  planName: string | null | undefined,
): string => line.description?.trim() || planName?.trim() || "Line item";

/** Credits (negative prorations) get their own tone in every renderer. */
export const isCreditLine = (line: IInvoiceLine): boolean => line.amount_cents < 0;

/* ---------------- totals ladder ---------------- */

export type LadderTone = "default" | "credit" | "strong" | "muted";

export interface LadderRow {
  key: string;
  label: string;
  cents: number;
  tone: LadderTone;
}

/**
 * The printable totals ladder, in document order. Every renderer draws a rule
 * above each row, which is what gives the reference layout its banded look.
 *
 * Everything here is READ from `totals`; the single derived value —
 * "Total excluding tax" — is computed as `total - tax` rather than
 * `subtotal - discount` so it can never disagree with the Total and Tax rows
 * printed beside it, even though the arithmetic contract says both are equal.
 * It is always shown, tax or no tax, matching the reference document.
 *
 * Two rows are conditional, per §4 of the guide: a Discount row only when there
 * is one, and a Refunded row whenever money went back (Stripe still reports
 * such an invoice as fully paid, so without it the document reads as a plain
 * paid invoice). A voided invoice shows no balance at all.
 */
export const buildTotalsLadder = (
  totals: IInvoiceTotals,
  options: { voided?: boolean } = {},
): LadderRow[] => {
  const rows: LadderRow[] = [
    { key: "subtotal", label: "Subtotal", cents: totals.subtotal_cents, tone: "default" },
  ];

  if (totals.discount_cents > 0) {
    rows.push({
      key: "discount",
      label: "Discount",
      cents: -totals.discount_cents,
      tone: "credit",
    });
  }

  rows.push({
    key: "total_excluding_tax",
    label: "Total excluding tax",
    cents: totals.total_cents - totals.tax_cents,
    tone: "default",
  });
  rows.push({ key: "tax", label: "Tax", cents: totals.tax_cents, tone: "default" });
  rows.push({
    key: "total",
    label: "Total",
    cents: totals.total_cents,
    tone: "strong",
  });
  rows.push({
    key: "amount_paid",
    label: "Amount paid",
    cents: totals.amount_paid_cents,
    tone: "strong",
  });

  if (totals.refunded_cents > 0) {
    rows.push({
      key: "refunded",
      label: "Refunded",
      cents: -totals.refunded_cents,
      tone: "credit",
    });
  }

  // Voided ⇒ `amount_remaining_cents` is 0 and nothing is owed; printing a
  // balance row at all invites "do I still pay this?".
  if (!options.voided) {
    rows.push({
      key: "amount_remaining",
      label: "Amount remaining",
      cents: totals.amount_remaining_cents,
      tone: "strong",
    });
  }

  return rows;
};

/* ---------------- money at the render boundary ---------------- */

/**
 * Re-exported so invoice renderers have one import for money and cannot reach
 * for a hand-rolled `cents / 100`.
 */
export const formatInvoiceMoney = formatCents;

/* ---------------- text collection (PDF font decisions) ---------------- */

/**
 * Every user-supplied string the document will print. The PDF exporter scans
 * this to decide whether jsPDF's WinAnsi core font can carry the document or
 * whether the non-Latin text has to be rasterised — company names arrive in
 * Bengali and any other script.
 */
export const collectInvoiceText = (invoice: IBillingInvoiceDetail): string[] => {
  const { seller, bill_to: billTo } = invoice;
  return [
    invoice.invoice_number,
    invoice.plan_name ?? "",
    seller?.name ?? "",
    seller?.product_name ?? "",
    ...(seller?.address_lines ?? []),
    seller?.phone ?? "",
    seller?.support_email ?? "",
    billTo?.name ?? "",
    billTo?.address ?? "",
    billTo?.email ?? "",
    ...(invoice.lines ?? []).map((line) => line.description ?? ""),
  ].filter(Boolean);
};

/** `invoice-A1B2C3D4-0001.pdf`, with anything filesystem-hostile stripped. */
export const invoicePdfFileName = (invoiceNumber: string): string => {
  const safe = invoiceNumber.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
  return `invoice-${safe || "document"}.pdf`;
};
