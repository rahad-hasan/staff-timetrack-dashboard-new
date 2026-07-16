import { PayrollRunStatus, PayrollSalaryType } from "@/types/payroll";

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
