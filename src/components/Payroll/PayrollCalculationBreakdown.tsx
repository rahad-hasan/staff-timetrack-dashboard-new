"use client";

import { useState } from "react";
import {
  ChevronDown,
  Clock,
  Code2,
  Coins,
  Info,
  ReceiptText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatPayrollHours, formatPayrollMoney } from "@/lib/payroll";
import { EmployeePayroll } from "@/types/payroll";
import PayrollAdjustmentLines, {
  PayrollAmountRow,
} from "./PayrollAdjustmentLines";

interface PayrollCalculationBreakdownProps {
  item: EmployeePayroll;
  /** Provided only when the viewer may edit adjustments on this run. */
  onAdjust?: () => void;
}

type HourKey =
  | "worked_hours"
  | "leave_hours"
  | "holiday_hours"
  | "overtime_hours";

const HOUR_SEGMENTS: Array<{
  key: HourKey;
  label: string;
  swatch: string;
}> = [
  { key: "worked_hours", label: "Worked", swatch: "bg-emerald-500" },
  { key: "leave_hours", label: "Leave", swatch: "bg-amber-500" },
  { key: "holiday_hours", label: "Holiday", swatch: "bg-violet-500" },
  { key: "overtime_hours", label: "Overtime", swatch: "bg-sky-500" },
];

const PayrollCalculationBreakdown = ({
  item,
  onAdjust,
}: PayrollCalculationBreakdownProps) => {
  const [showRaw, setShowRaw] = useState(false);

  const snapshot = (item.calculation_snapshot ?? {}) as Record<string, unknown>;
  const fx = (snapshot.fx ?? {}) as Record<string, unknown>;
  const fxFrom = typeof fx.from === "string" ? fx.from : item.currency;
  const fxTo = typeof fx.to === "string" ? fx.to : item.currency;
  const fxRate = typeof fx.rate === "number" ? fx.rate : 1;
  const fxSource =
    fx.source && typeof fx.source === "object"
      ? ((fx.source as Record<string, unknown>).provider as string | undefined)
      : undefined;
  const showFx =
    fxFrom !== fxTo || fxRate !== 1 || (!!fxSource && fxSource !== "identity");

  const target = Number(item.target_hours || 0);
  const totalTracked = HOUR_SEGMENTS.reduce(
    (sum, seg) => sum + Number(item[seg.key] || 0),
    0,
  );
  const denominator = Math.max(totalTracked, target, 1);
  const attendance =
    target > 0
      ? Math.min(
          999,
          (Number(item.worked_hours || 0) / target) * 100,
        )
      : null;

  const overtimeRate =
    Number(item.hourly_rate || 0) * Number(item.overtime_multiplier || 0);
  const overtimeHint =
    Number(item.overtime_hours || 0) > 0 && overtimeRate > 0
      ? `${formatPayrollHours(item.overtime_hours)} × ${formatPayrollMoney(
          overtimeRate,
          item.currency,
        )}/hr`
      : undefined;

  const basicHint =
    item.salary_type === "hourly" && Number(item.hourly_rate || 0) > 0
      ? `${formatPayrollHours(item.payable_hours)} × ${formatPayrollMoney(
          item.hourly_rate,
          item.currency,
        )}/hr`
      : "Fixed monthly base";

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[10px] border border-borderColor bg-white p-4 dark:border-darkBorder dark:bg-darkSecondaryBg">
          <header className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400">
                <Clock className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                  Hours breakdown
                </p>
                <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                  {formatPayrollHours(item.payable_hours)} payable of{" "}
                  {formatPayrollHours(target)} target
                </p>
              </div>
            </div>
            {attendance !== null ? (
              <span className="whitespace-nowrap rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                {attendance.toFixed(0)}% attendance
              </span>
            ) : null}
          </header>

          <div className="mb-3 flex h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/5">
            {HOUR_SEGMENTS.map((segment) => {
              const value = Number(item[segment.key] || 0);
              if (value <= 0) return null;
              const width = (value / denominator) * 100;
              return (
                <div
                  key={segment.key}
                  className={segment.swatch}
                  style={{ width: `${width}%` }}
                  title={`${segment.label}: ${formatPayrollHours(value)}`}
                />
              );
            })}
          </div>

          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {HOUR_SEGMENTS.map((segment) => {
              const value = Number(item[segment.key] || 0);
              return (
                <li
                  key={segment.key}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2 text-subTextColor dark:text-darkTextSecondary">
                    <span className={`size-2 rounded-full ${segment.swatch}`} />
                    {segment.label}
                  </span>
                  <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                    {formatPayrollHours(value)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-[10px] border border-borderColor bg-white p-4 dark:border-darkBorder dark:bg-darkSecondaryBg">
          <header className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="rounded-md bg-primary/10 p-1.5 text-primary">
                <ReceiptText className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                  Salary formula
                </p>
                <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                  {basicHint}
                </p>
              </div>
            </div>
            {onAdjust ? (
              <Button variant="outline2" size="sm" onClick={onAdjust}>
                Adjust
              </Button>
            ) : null}
          </header>

          <div className="space-y-2 text-sm">
            <PayrollAmountRow
              label="Basic salary"
              value={formatPayrollMoney(item.basic_salary, item.currency)}
              tone="neutral"
            />
            <PayrollAmountRow
              label="Overtime"
              value={`+ ${formatPayrollMoney(item.overtime_amount, item.currency)}`}
              tone={item.overtime_amount > 0 ? "positive" : "muted"}
              hint={overtimeHint}
            />
            {/* Above the subtotal: gross_salary is already net of the
                deduction, so subtracting it after Gross never balanced. */}
            <PayrollAmountRow
              label="Deduction"
              value={`− ${formatPayrollMoney(item.deduction_amount, item.currency)}`}
              tone={item.deduction_amount > 0 ? "negative" : "muted"}
            />
            <div className="my-2 border-t border-dashed border-borderColor dark:border-darkBorder" />
            <PayrollAmountRow
              label="Gross salary"
              value={formatPayrollMoney(item.gross_salary, item.currency)}
              tone="subtotal"
            />

            <PayrollAdjustmentLines item={item} />

            <div className="my-2 border-t border-borderColor dark:border-darkBorder" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                Final payable
              </span>
              <span className="text-lg font-bold text-primary">
                {formatPayrollMoney(item.final_salary, item.currency)}
              </span>
            </div>
          </div>
        </section>
      </div>

      {showFx ? (
        <section className="rounded-[10px] border border-borderColor bg-white p-4 dark:border-darkBorder dark:bg-darkSecondaryBg">
          <header className="mb-3 flex items-start gap-2.5">
            <div className="rounded-md bg-amber-500/10 p-1.5 text-amber-600 dark:text-amber-400">
              <Coins className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                Currency conversion
              </p>
              <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                Rate source: {fxSource ?? "identity"}
              </p>
            </div>
          </header>

          <div className="grid gap-3 sm:grid-cols-3">
            <FxCell label="From" value={fxFrom} />
            <FxCell
              label="Rate"
              value={`1 ${fxFrom} = ${fxRate.toLocaleString(undefined, {
                maximumFractionDigits: 6,
              })} ${fxTo}`}
            />
            <FxCell label="To" value={fxTo} />
          </div>
        </section>
      ) : null}

      {item.notes ? (
        <div className="flex gap-3 rounded-[10px] border border-borderColor bg-white p-4 text-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <div>
            <p className="mb-1 font-medium text-headingTextColor dark:text-darkTextPrimary">
              Notes
            </p>
            <p className="text-subTextColor dark:text-darkTextSecondary">
              {item.notes}
            </p>
          </div>
        </div>
      ) : null}

      <div className="rounded-[10px] border border-borderColor bg-white dark:border-darkBorder dark:bg-darkSecondaryBg">
        <button
          type="button"
          onClick={() => setShowRaw((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 rounded-[10px] px-4 py-3 text-left text-sm font-medium text-headingTextColor hover:bg-bgSecondary/40 dark:text-darkTextPrimary dark:hover:bg-darkPrimaryBg/40"
          aria-expanded={showRaw}
        >
          <span className="flex items-center gap-2">
            <Code2 className="size-4 text-subTextColor dark:text-darkTextSecondary" />
            Raw calculation snapshot
          </span>
          <ChevronDown
            className={`size-4 text-subTextColor transition-transform dark:text-darkTextSecondary ${
              showRaw ? "rotate-180" : ""
            }`}
          />
        </button>
        {showRaw ? (
          <pre className="max-h-[280px] overflow-auto border-t border-borderColor bg-bgSecondary/30 p-3 text-xs text-subTextColor dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextSecondary">
            {JSON.stringify(item.calculation_snapshot, null, 2)}
          </pre>
        ) : null}
      </div>
    </div>
  );
};

const FxCell = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-[8px] border border-borderColor bg-bgSecondary/30 p-3 dark:border-darkBorder dark:bg-darkPrimaryBg">
    <p className="text-[11px] uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
      {label}
    </p>
    <p className="mt-1 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
      {value}
    </p>
  </div>
);

export default PayrollCalculationBreakdown;
