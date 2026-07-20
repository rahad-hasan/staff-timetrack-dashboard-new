import {
  EmployeePayroll,
  PayrollAdjustment,
  PayrollRunStatus,
  PayrollSalaryType,
} from "@/types/payroll";
import { IResponse } from "@/types/type";

export const formatPayrollHours = (hours: number | null | undefined) => {
  if (!hours || hours <= 0) return "0h 0m";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
};

export const formatPayrollMoney = (
  amount: number | null | undefined,
  currency: string | null | undefined,
) => {
  const value = typeof amount === "number" && !Number.isNaN(amount) ? amount : 0;
  const safeCurrency =
    currency && typeof currency === "string" && currency.trim().length === 3
      ? currency.toUpperCase()
      : "USD";

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${safeCurrency} ${value.toFixed(2)}`;
  }
};

export const monthName = (month: number) => {
  const idx = Math.max(1, Math.min(12, month)) - 1;
  return new Date(2000, idx, 1).toLocaleString(undefined, { month: "long" });
};

export const formatPayrollPeriod = (month: number, year: number) =>
  `${monthName(month)} ${year}`;

const PAYROLL_ADMIN_ROLES = new Set(["admin", "hr"]);

export const canManagePayroll = (role: string | null | undefined) =>
  !!role && PAYROLL_ADMIN_ROLES.has(role.toLowerCase());

export const isRunLocked = (status: PayrollRunStatus) =>
  status === "approved" || status === "paid";

export const salaryTypeIsHourly = (type: PayrollSalaryType) => type === "hourly";

/* ---------------- Manual adjustments ---------------- */

export const PAYROLL_ADJUSTMENT_LIMITS = {
  MAX_BONUSES: 20,
  MAX_TITLE: 100,
  MAX_AMOUNT: 100000000,
} as const;

/**
 * Splits an item's adjustment lines into what the UI can render.
 *
 * `deduction_waiver` entries are dropped from every list — their `amount` is
 * always 0 and the waiver is rendered from `item.waived_amount` instead.
 * `hasLineItems` distinguishes "no adjustments" from "line items withheld",
 * which the REPLACE editor must not confuse.
 */
export const splitAdjustments = (
  item: Pick<EmployeePayroll, "adjustments">,
): {
  hasLineItems: boolean;
  appliedBonuses: PayrollAdjustment[];
  staleBonuses: PayrollAdjustment[];
} => {
  const lines = item.adjustments;
  const bonuses = (lines ?? []).filter((line) => line.type === "bonus");
  return {
    hasLineItems: Array.isArray(lines),
    // `applied` is absent on the PUT response, so undefined counts as applied.
    appliedBonuses: bonuses.filter((line) => line.applied !== false),
    staleBonuses: bonuses.filter((line) => line.applied === false),
  };
};

export type AdjustmentErrorKind =
  | "locked"
  | "not_found"
  | "conflict"
  | "forbidden"
  | "validation"
  | "network"
  | "unknown";

const LOCKED_HINT = /(approved|locked|paid|frozen)/i;
// Deliberately excludes a bare "lock": it would also match "locked" and, being
// tested first, would shadow LOCKED_HINT below.
const CONFLICT_HINT = /(regenerat|in progress|try again)/i;

/**
 * Maps a failed adjustments response onto the UI reaction the API guide
 * prescribes. Falls back to message sniffing because only the 200 envelope is
 * documented — if the backend does send `statusCode` on errors the fallbacks
 * never fire.
 */
export const resolveAdjustmentError = <T,>(
  response: IResponse<T> | null | undefined,
): { kind: AdjustmentErrorKind; message: string } => {
  // `statusCode` is typed required on IResponse but is genuinely absent on
  // baseApi's network-failure path, and 0 on our synthetic envelope.
  const status = (response as { statusCode?: number } | null | undefined)
    ?.statusCode;
  const message = response?.message ?? "";

  if (status === 403) {
    return {
      kind: "forbidden",
      message: "You don't have permission to adjust this payroll.",
    };
  }
  if (status === 404) {
    return {
      kind: "not_found",
      message: "This employee is no longer on this payroll run.",
    };
  }
  if (status === 409) {
    return {
      kind: "conflict",
      message: "Payroll is regenerating. Please retry in a moment.",
    };
  }
  if (status === 400) {
    // 400 is overloaded: the guide documents "run is locked", but a backend
    // validation rejection is also 400. Treating both as locked would close
    // the dialog and destroy unsaved rows while showing a false reason.
    return LOCKED_HINT.test(message)
      ? {
          kind: "locked",
          message:
            "This run is approved and locked. Adjustments can't be changed.",
        }
      : {
          kind: "validation",
          message: message || "Some values were rejected. Please check the form.",
        };
  }
  if (status == null || status === 0) {
    if (CONFLICT_HINT.test(message)) return { kind: "conflict", message };
    if (LOCKED_HINT.test(message)) return { kind: "locked", message };
    return {
      kind: "network",
      message: message || "Couldn't reach the payroll service.",
    };
  }
  return { kind: "unknown", message: message || "Failed to save adjustments." };
};

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEK_START_ISO: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};

export const weekendPreview = (
  weekStart: string,
  weeklyLeaveCount: number,
): string => {
  const startIso = WEEK_START_ISO[weekStart] ?? 1;
  const count = Math.max(0, Math.min(7, Math.floor(weeklyLeaveCount)));

  if (count === 0) return "None (7-day work week)";
  if (count === 7) return "Every day (no work days)";

  const days: string[] = [];
  for (let i = 7 - count; i < 7; i++) {
    const iso = ((startIso - 1 + i) % 7) + 1;
    days.push(WEEKDAY_LABELS[iso - 1]);
  }
  return days.join(" + ");
};
