import { formatPayrollMoney, splitAdjustments } from "@/lib/payroll";
import { EmployeePayroll } from "@/types/payroll";

interface PayrollAmountRowProps {
  label: string;
  value: string;
  tone?: "neutral" | "muted" | "positive" | "negative" | "subtotal";
  hint?: string;
}

/**
 * One label/amount line in a salary breakdown. Shared so the HR run-detail
 * breakdown and the employee payslip render adjustments identically.
 */
export const PayrollAmountRow = ({
  label,
  value,
  tone = "neutral",
  hint,
}: PayrollAmountRowProps) => {
  const valueClass =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400 font-medium"
      : tone === "negative"
        ? "text-red-600 dark:text-red-400 font-medium"
        : tone === "subtotal"
          ? "font-semibold text-headingTextColor dark:text-darkTextPrimary"
          : tone === "muted"
            ? "text-subTextColor dark:text-darkTextSecondary"
            : "text-headingTextColor dark:text-darkTextPrimary";

  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-subTextColor dark:text-darkTextSecondary">{label}</p>
        {hint ? (
          <p className="mt-0.5 text-[11px] text-subTextColor/80 dark:text-darkTextSecondary/80">
            {hint}
          </p>
        ) : null}
      </div>
      <span className={valueClass}>{value}</span>
    </div>
  );
};

interface PayrollAdjustmentLinesProps {
  item: Pick<
    EmployeePayroll,
    "adjustments" | "deduction_waived" | "waived_amount" | "currency"
  >;
}

/**
 * The manual-adjustment portion of a salary breakdown: the waived deduction
 * followed by each bonus line.
 *
 * Returns a Fragment on purpose — both callers wrap it in a `space-y-2`
 * container, whose `> * + *` selector only applies to direct siblings.
 *
 * Bonus amounts render in the line's OWN currency, and `applied: false` lines
 * render muted with no `+` sign so they can never read as money paid.
 */
const PayrollAdjustmentLines = ({ item }: PayrollAdjustmentLinesProps) => {
  const { appliedBonuses, staleBonuses } = splitAdjustments(item);

  return (
    <>
      {item.deduction_waived ? (
        <PayrollAmountRow
          label="Deduction waived"
          value={`+ ${formatPayrollMoney(item.waived_amount, item.currency)}`}
          tone="positive"
        />
      ) : null}

      {appliedBonuses.map((line) => (
        <PayrollAmountRow
          key={line.id}
          label={line.title}
          value={`+ ${formatPayrollMoney(line.amount, line.currency)}`}
          tone="positive"
        />
      ))}

      {staleBonuses.map((line) => (
        <PayrollAmountRow
          key={line.id}
          label={line.title}
          value={formatPayrollMoney(line.amount, line.currency)}
          tone="muted"
          hint="not applied — currency changed"
        />
      ))}
    </>
  );
};

export default PayrollAdjustmentLines;
