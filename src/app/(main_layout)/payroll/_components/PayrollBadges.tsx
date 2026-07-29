import { cn } from "@/lib/utils";
import {
  PayrollRunStatus,
  PayrollSalaryType,
  RUN_STATUS_BADGE_CLASSES,
  RUN_STATUS_LABELS,
  SALARY_TYPE_LABELS,
} from "@/types/payroll";

interface RunStatusBadgeProps {
  status: PayrollRunStatus;
  className?: string;
}

export const PayrollRunStatusBadge = ({
  status,
  className,
}: RunStatusBadgeProps) => {
  const badgeClass =
    RUN_STATUS_BADGE_CLASSES[status] ?? RUN_STATUS_BADGE_CLASSES.draft;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        badgeClass,
        className,
      )}
    >
      {RUN_STATUS_LABELS[status] ?? status}
    </span>
  );
};

interface SalaryTypeBadgeProps {
  type: PayrollSalaryType;
  className?: string;
}

export const SalaryTypeBadge = ({ type, className }: SalaryTypeBadgeProps) => {
  const isHourly = type === "hourly";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        isHourly
          ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800"
          : "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800",
        className,
      )}
    >
      {SALARY_TYPE_LABELS[type] ?? type}
    </span>
  );
};

interface ProfileActiveBadgeProps {
  isActive: boolean;
  className?: string;
}

export const ProfileActiveBadge = ({
  isActive,
  className,
}: ProfileActiveBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
      isActive
        ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800"
        : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700",
      className,
    )}
  >
    {isActive ? "Active" : "Inactive"}
  </span>
);
