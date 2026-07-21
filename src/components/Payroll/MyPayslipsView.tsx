"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import {
  Calendar,
  ChevronRight,
  Download,
  Loader2,
  Wallet,
} from "lucide-react";

import { YearPicker } from "@/components/Common/YearPicker";
import { Button } from "@/components/ui/button";
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
  splitAdjustments,
} from "@/lib/payroll";
import { useLogInUserStore } from "@/store/logInUserStore";
import { EmployeePayroll } from "@/types/payroll";
import PayrollAdjustmentLines, {
  PayrollAmountRow,
} from "./PayrollAdjustmentLines";
import { PayrollRunStatusBadge, SalaryTypeBadge } from "./PayrollBadges";
import { downloadPayslipPdf } from "./payslipPdfExport";

interface MyPayslipsViewProps {
  items: EmployeePayroll[];
  selectedYear: number;
}

const MyPayslipsView = ({ items, selectedYear }: MyPayslipsViewProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeItem, setActiveItem] = useState<EmployeePayroll | null>(null);
  // Holds the id being generated rather than a boolean per card, so a slow
  // download only disables its own button.
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const logInUserData = useLogInUserStore((state) => state.logInUserData);

  // /payroll/history doesn't embed the user object, so identity comes from the
  // logged-in user — these payslips are always the viewer's own.
  const handleDownload = useCallback(
    async (item: EmployeePayroll) => {
      setDownloadingId(item.id);
      await downloadPayslipPdf(item, {
        name: logInUserData?.name,
        email: logInUserData?.email,
      });
      setDownloadingId(null);
    },
    [logInUserData?.name, logInUserData?.email],
  );

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

  // final_salary can now legitimately exceed gross_salary, which reads as a bug
  // without saying why.
  const hasAnyAdjustment = useMemo(
    () =>
      filtered.some(
        (item) =>
          item.deduction_waived ||
          splitAdjustments(item).appliedBonuses.length > 0,
      ),
    [filtered],
  );

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
                <div className="flex flex-wrap items-center gap-2">
                  <SalaryTypeBadge type={activeItem.salary_type} />
                  {activeItem.payrollRun ? (
                    <PayrollRunStatusBadge
                      status={activeItem.payrollRun.status}
                    />
                  ) : null}
                  <DownloadPayslipButton
                    loading={downloadingId === activeItem.id}
                    onDownload={() => handleDownload(activeItem)}
                    className="ml-auto"
                  />
                </div>

                {activeItem.target_hours > 0 ? (
                  <div className="rounded-[8px] border border-borderColor bg-bgSecondary/50 p-3 text-sm dark:border-darkBorder dark:bg-darkPrimaryBg">
                    <p className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                      Target hours this month ·{" "}
                      {formatPayrollHours(activeItem.target_hours)}
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
                  <PayrollAmountRow
                    label="Basic salary"
                    value={formatPayrollMoney(
                      activeItem.basic_salary,
                      activeItem.currency,
                    )}
                  />
                  <PayrollAmountRow
                    label="Hourly rate"
                    value={`${formatPayrollMoney(
                      activeItem.hourly_rate,
                      activeItem.currency,
                    )} / hr`}
                  />
                  <PayrollAmountRow
                    label="Overtime amount"
                    value={formatPayrollMoney(
                      activeItem.overtime_amount,
                      activeItem.currency,
                    )}
                  />
                  <PayrollAmountRow
                    label="Deduction"
                    value={`- ${formatPayrollMoney(
                      activeItem.deduction_amount,
                      activeItem.currency,
                    )}`}
                    tone="negative"
                  />

                  <PayrollAdjustmentLines item={activeItem} />

                  <div className="mt-2 flex items-center justify-between border-t border-borderColor pt-2 dark:border-darkBorder">
                    <span className="font-semibold text-headingTextColor dark:text-darkTextPrimary">
                      Final salary
                    </span>
                    <span className="text-xl font-bold text-primary">
                      {formatPayrollMoney(
                        activeItem.final_salary,
                        activeItem.currency,
                      )}
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
              {hasAnyAdjustment
                ? " · net includes bonuses & waived deductions"
                : ""}
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
              Only approved and paid payslips appear here. Draft runs are hidden
              until they&apos;re finalised.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => (
              // A div, not a button: it contains the download button, and
              // nesting interactive elements is invalid HTML.
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => setActiveItem(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveItem(item);
                  }
                }}
                className="group cursor-pointer rounded-[12px] border border-borderColor bg-white p-5 text-left transition hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-darkBorder dark:bg-darkSecondaryBg"
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
                      ? new Date(
                          item.payrollRun.approved_at,
                        ).toLocaleDateString()
                      : ""}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-primary group-hover:translate-x-0.5 group-hover:transition">
                    View breakdown
                    <ChevronRight className="size-3.5" />
                  </span>
                </div>

                <DownloadPayslipButton
                  loading={downloadingId === item.id}
                  onDownload={() => handleDownload(item)}
                  className="mt-4 w-full"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

interface DownloadPayslipButtonProps {
  loading: boolean;
  onDownload: () => void;
  className?: string;
  label?: string;
}

/**
 * Shared by the card and the dialog so both stay in sync. Stops propagation
 * because the card itself is a button that opens the breakdown dialog.
 */
const DownloadPayslipButton = ({
  loading,
  onDownload,
  className,
  label = "Download PDF",
}: DownloadPayslipButtonProps) => (
  <Button
    variant="outline2"
    size="sm"
    disabled={loading}
    className={className}
    onClick={(event) => {
      event.stopPropagation();
      onDownload();
    }}
  >
    {loading ? (
      <Loader2 className="size-4 animate-spin" />
    ) : (
      <Download className="size-4" />
    )}
    {label}
  </Button>
);

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

export default MyPayslipsView;
