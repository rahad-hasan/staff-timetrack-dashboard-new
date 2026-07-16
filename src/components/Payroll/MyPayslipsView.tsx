"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Calendar, ChevronRight, Wallet } from "lucide-react";

import { YearPicker } from "@/components/Common/YearPicker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatPayrollHours,
  formatPayrollMoney,
  monthName,
} from "@/lib/payroll";
import { EmployeePayroll } from "@/types/payroll";
import { PayrollRunStatusBadge, SalaryTypeBadge } from "./PayrollBadges";

interface MyPayslipsViewProps {
  items: EmployeePayroll[];
  selectedYear: number;
}

const MyPayslipsView = ({ items, selectedYear }: MyPayslipsViewProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeItem, setActiveItem] = useState<EmployeePayroll | null>(null);

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          item.payrollRun?.status === "approved" ||
          item.payrollRun?.status === "paid",
      ),
    [items],
  );

  const stats = useMemo(() => {
    const totalNet = filtered.reduce(
      (acc, item) => acc + Number(item.final_salary || 0),
      0,
    );
    const totalGross = filtered.reduce(
      (acc, item) => acc + Number(item.gross_salary || 0),
      0,
    );
    const currency = filtered[0]?.currency ?? "USD";
    return { totalNet, totalGross, currency };
  }, [filtered]);

  const pushYear = (year: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", year);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      <Dialog
        open={!!activeItem}
        onOpenChange={(open) => {
          if (!open) setActiveItem(null);
        }}
      >
        <DialogContent className="dark:bg-darkSecondaryBg max-w-lg">
          {activeItem ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {activeItem.payrollRun
                    ? `${monthName(activeItem.payrollRun.month)} ${activeItem.payrollRun.year}`
                    : "Payslip breakdown"}
                </DialogTitle>
                <DialogDescription>
                  Detailed calculation for your salary in this period.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <SalaryTypeBadge type={activeItem.salary_type} />
                  {activeItem.payrollRun ? (
                    <PayrollRunStatusBadge status={activeItem.payrollRun.status} />
                  ) : null}
                </div>

                {activeItem.target_hours > 0 ? (
                  <div className="rounded-[8px] border border-borderColor bg-bgSecondary/50 p-3 text-sm dark:border-darkBorder dark:bg-darkPrimaryBg">
                    <p className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                      Target hours this month · {formatPayrollHours(activeItem.target_hours)}
                    </p>
                    <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                      {describeTarget(activeItem)}
                    </p>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <StatCell
                    label="Target hours"
                    value={formatPayrollHours(activeItem.target_hours)}
                  />
                  <StatCell
                    label="Worked hours"
                    value={formatPayrollHours(activeItem.worked_hours)}
                  />
                  <StatCell
                    label="Leave hours"
                    value={formatPayrollHours(activeItem.leave_hours)}
                  />
                  {activeItem.holiday_hours > 0 ? (
                    <StatCell
                      label="Paid holidays"
                      value={describeHolidays(activeItem)}
                    />
                  ) : null}
                  <StatCell
                    label="Overtime hours"
                    value={formatPayrollHours(activeItem.overtime_hours)}
                  />
                  <StatCell
                    label="Payable hours"
                    value={formatPayrollHours(activeItem.payable_hours)}
                  />
                </div>

                <div className="space-y-2 rounded-[8px] border border-borderColor p-3 text-sm dark:border-darkBorder">
                  <Row
                    label="Basic salary"
                    value={formatPayrollMoney(
                      activeItem.basic_salary,
                      activeItem.currency,
                    )}
                  />
                  <Row
                    label="Hourly rate"
                    value={`${formatPayrollMoney(
                      activeItem.hourly_rate,
                      activeItem.currency,
                    )} / hr`}
                  />
                  <Row
                    label="Overtime amount"
                    value={formatPayrollMoney(
                      activeItem.overtime_amount,
                      activeItem.currency,
                    )}
                  />
                  <Row
                    label="Deduction"
                    value={`- ${formatPayrollMoney(
                      activeItem.deduction_amount,
                      activeItem.currency,
                    )}`}
                    negative
                  />
                  <div className="mt-2 flex items-center justify-between border-t border-borderColor pt-2 dark:border-darkBorder">
                    <span className="font-semibold text-headingTextColor dark:text-darkTextPrimary">
                      Final salary
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {formatPayrollMoney(activeItem.final_salary, activeItem.currency)}
                    </span>
                  </div>
                </div>

                {activeItem.notes ? (
                  <div className="rounded-[8px] border border-borderColor bg-bgSecondary/50 p-3 text-sm text-subTextColor dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextSecondary">
                    <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                      Notes:{" "}
                    </span>
                    {activeItem.notes}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-[12px] border border-borderColor p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
          <div>
            <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
              Total net paid in {selectedYear}
            </p>
            <p className="text-3xl font-semibold text-primary">
              {formatPayrollMoney(stats.totalNet, stats.currency)}
            </p>
            <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
              Gross: {formatPayrollMoney(stats.totalGross, stats.currency)} ·{" "}
              {filtered.length} payslip{filtered.length === 1 ? "" : "s"}
            </p>
          </div>
          <YearPicker
            value={String(selectedYear)}
            onYearChange={pushYear}
            startYear={new Date().getFullYear() - 5}
            endYear={new Date().getFullYear() + 1}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-[12px] border border-borderColor bg-white p-10 text-center dark:border-darkBorder dark:bg-darkSecondaryBg">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Wallet className="size-6" />
            </div>
            <p className="mt-4 text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
              No approved payslips for {selectedYear}
            </p>
            <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
              Only approved and paid payslips appear here. Draft runs are hidden until they&apos;re finalised.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveItem(item)}
                className="group rounded-[12px] border border-borderColor bg-white p-5 text-left transition hover:border-primary/40 hover:shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
                      Payslip
                    </p>
                    <p className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                      {item.payrollRun
                        ? `${monthName(item.payrollRun.month)} ${item.payrollRun.year}`
                        : "—"}
                    </p>
                  </div>
                  {item.payrollRun ? (
                    <PayrollRunStatusBadge status={item.payrollRun.status} />
                  ) : null}
                </div>

                <p className="mt-4 text-3xl font-bold text-primary">
                  {formatPayrollMoney(item.final_salary, item.currency)}
                </p>
                <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                  Payable hours: {formatPayrollHours(item.payable_hours)}
                </p>

                <div className="mt-4 flex items-center justify-between text-xs text-subTextColor dark:text-darkTextSecondary">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="size-3.5" />
                    {item.payrollRun?.approved_at
                      ? new Date(item.payrollRun.approved_at).toLocaleDateString()
                      : ""}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-primary group-hover:translate-x-0.5 group-hover:transition">
                    View breakdown
                    <ChevronRight className="size-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

const StatCell = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[8px] border border-borderColor bg-bgSecondary/50 p-2 dark:border-darkBorder dark:bg-darkPrimaryBg">
    <p className="text-xs uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
      {label}
    </p>
    <p className="font-medium text-headingTextColor dark:text-darkTextPrimary">
      {value}
    </p>
  </div>
);

const snapshotNumber = (
  snapshot: Record<string, unknown>,
  key: string,
): number | null => {
  const value = snapshot?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const describeTarget = (item: EmployeePayroll): string => {
  const snapshot = item.calculation_snapshot ?? {};
  const perDay =
    snapshotNumber(snapshot, "per_day_hours") ??
    snapshotNumber(snapshot, "hours_per_day") ??
    8;
  const workdays = Math.max(1, Math.round(item.target_hours / perDay));
  return `${workdays} workday${workdays === 1 ? "" : "s"} × ${formatPayrollHours(perDay)} (from your Schedule and company weekend settings)`;
};

const describeHolidays = (item: EmployeePayroll): string => {
  const snapshot = item.calculation_snapshot ?? {};
  const perDay =
    snapshotNumber(snapshot, "per_day_hours") ??
    snapshotNumber(snapshot, "hours_per_day") ??
    8;
  const holidayCount =
    snapshotNumber(snapshot, "weekday_holiday_count") ??
    Math.max(1, Math.round(item.holiday_hours / perDay));
  return `${holidayCount} weekday holiday${holidayCount === 1 ? "" : "s"} → +${formatPayrollHours(item.holiday_hours)}`;
};

const Row = ({
  label,
  value,
  negative,
}: {
  label: string;
  value: string;
  negative?: boolean;
}) => (
  <div className="flex items-center justify-between">
    <span className="text-subTextColor dark:text-darkTextSecondary">{label}</span>
    <span
      className={
        negative
          ? "text-red-600"
          : "text-headingTextColor dark:text-darkTextPrimary"
      }
    >
      {value}
    </span>
  </div>
);

export default MyPayslipsView;
