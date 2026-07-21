import { toast } from "sonner";
import type jsPDF from "jspdf";

import {
  formatPayrollHours,
  formatPayrollMoney,
  formatPayrollPeriod,
  splitAdjustments,
} from "@/lib/payroll";
import {
  EmployeePayroll,
  RUN_STATUS_LABELS,
  SALARY_TYPE_LABELS,
} from "@/types/payroll";
import {
  A4_PORTRAIT,
  PAGE_MARGIN,
  PDF_PALETTE,
  STATUS_COLOR,
  TABLE_STYLES,
  drawBadge,
  drawCard,
  drawDivider,
  drawFooter,
  drawNotesBlock,
  drawText,
  dateRange,
  drawTopBrandBar,
  lastTableBottom,
  loadPdfLibs,
  safeDate,
  slugify,
  truncateToWidth,
  type Rgb,
} from "./payrollPdfKit";

export interface PayslipEmployee {
  name?: string | null;
  email?: string | null;
}

const CONTENT_WIDTH = A4_PORTRAIT.width - PAGE_MARGIN * 2;

const DISCLAIMER =
  "This is a computer-generated payslip and does not require a signature.";

const snapshotNumber = (
  snapshot: Record<string, unknown> | null | undefined,
  key: string,
): number | null => {
  const value = snapshot?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const perDayHours = (item: EmployeePayroll) =>
  snapshotNumber(item.calculation_snapshot, "per_day_hours") ??
  snapshotNumber(item.calculation_snapshot, "hours_per_day") ??
  8;

/* ---------------- sections ---------------- */

/** Masthead: brand bar, PAYSLIP wordmark, pay period and status pill. */
const drawMasthead = (doc: jsPDF, item: EmployeePayroll) => {
  drawTopBrandBar(doc);

  const period = item.payrollRun
    ? formatPayrollPeriod(item.payrollRun.month, item.payrollRun.year)
    : "Payslip";

  drawText(doc, "PAYSLIP", PAGE_MARGIN, 40, {
    size: 22,
    bold: true,
    color: PDF_PALETTE.heading,
  });
  drawText(doc, period, PAGE_MARGIN, 58, { size: 11 });

  const status = item.payrollRun?.status;
  if (status) {
    drawBadge(
      doc,
      RUN_STATUS_LABELS[status] ?? status,
      A4_PORTRAIT.width - PAGE_MARGIN,
      26,
      STATUS_COLOR[status] ?? PDF_PALETTE.subtext,
    );
  }

  drawText(
    doc,
    SALARY_TYPE_LABELS[item.salary_type] ?? item.salary_type,
    A4_PORTRAIT.width - PAGE_MARGIN,
    58,
    { size: 9, align: "right" },
  );

  drawDivider(doc, 72);
};

/**
 * Identity block: who was paid, on the left; which period and when it was
 * approved, on the right. Returns the y below the block.
 */
const drawIdentityBlock = (
  doc: jsPDF,
  item: EmployeePayroll,
  employee: PayslipEmployee,
) => {
  const top = 88;
  const height = 74;
  const colWidth = (CONTENT_WIDTH - 12) / 2;
  const rightX = PAGE_MARGIN + colWidth + 12;

  drawCard(doc, PAGE_MARGIN, top, colWidth, height, { fill: PDF_PALETTE.softBg });
  drawCard(doc, rightX, top, colWidth, height, { fill: PDF_PALETTE.softBg });

  const name = employee.name?.trim() || "—";
  const email = employee.email?.trim() || "";

  drawText(doc, "EMPLOYEE", PAGE_MARGIN + 14, top + 18, { size: 7.5, bold: true });
  drawText(
    doc,
    truncateToWidth(doc, name, colWidth - 28, 13, true),
    PAGE_MARGIN + 14,
    top + 38,
    { size: 13, bold: true, color: PDF_PALETTE.heading },
  );
  if (email) {
    drawText(
      doc,
      truncateToWidth(doc, email, colWidth - 28, 8.5),
      PAGE_MARGIN + 14,
      top + 54,
      { size: 8.5 },
    );
  }
  drawText(doc, `Payslip ID · ${item.id}`, PAGE_MARGIN + 14, top + 66, { size: 8 });

  const run = item.payrollRun;
  const rows: Array<[string, string]> = [
    ["Pay period", run ? dateRange(run.period_start, run.period_end) : "—"],
    ["Payment date", run?.paid_at ? safeDate(run.paid_at) : "Pending"],
    ["Approved on", run?.approved_at ? safeDate(run.approved_at) : "—"],
  ];

  drawText(doc, "PAY DETAILS", rightX + 14, top + 18, { size: 7.5, bold: true });
  rows.forEach(([label, value], idx) => {
    const y = top + 34 + idx * 14;
    drawText(doc, label, rightX + 14, y, { size: 8.5 });
    drawText(
      doc,
      truncateToWidth(doc, value, colWidth - 100, 8.5, true),
      rightX + colWidth - 14,
      y,
      { size: 8.5, bold: true, color: PDF_PALETTE.heading, align: "right" },
    );
  });

  return top + height;
};

/** The hero band — the one number the employee actually opened this file for. */
const drawNetPayBand = (
  doc: jsPDF,
  item: EmployeePayroll,
  top: number,
) => {
  const height = 62;

  doc.setFillColor(...PDF_PALETTE.heading);
  doc.roundedRect(PAGE_MARGIN, top, CONTENT_WIDTH, height, 8, 8, "F");
  doc.setFillColor(...PDF_PALETTE.brand);
  doc.roundedRect(PAGE_MARGIN, top, 4, height, 2, 2, "F");

  drawText(doc, "NET PAY", PAGE_MARGIN + 18, top + 24, {
    size: 8,
    bold: true,
    color: PDF_PALETTE.brand,
  });
  drawText(
    doc,
    formatPayrollMoney(item.final_salary, item.currency),
    PAGE_MARGIN + 18,
    top + 48,
    { size: 24, bold: true, color: PDF_PALETTE.white },
  );

  drawText(doc, "PAYABLE HOURS", A4_PORTRAIT.width - PAGE_MARGIN - 18, top + 24, {
    size: 8,
    bold: true,
    color: PDF_PALETTE.brand,
    align: "right",
  });
  drawText(
    doc,
    formatPayrollHours(item.payable_hours),
    A4_PORTRAIT.width - PAGE_MARGIN - 18,
    top + 46,
    { size: 14, bold: true, color: PDF_PALETTE.white, align: "right" },
  );

  return top + height;
};

const HOUR_CELLS: Array<{
  label: string;
  value: (item: EmployeePayroll) => string;
  hint: (item: EmployeePayroll) => string;
  accent: Rgb;
}> = [
  {
    label: "Target",
    value: (it) => formatPayrollHours(it.target_hours),
    hint: (it) => {
      const perDay = perDayHours(it);
      // Never round a real target down to 0 days, but don't invent a workday
      // when the target genuinely is 0.
      const days = it.target_hours > 0
        ? Math.max(1, Math.round(it.target_hours / perDay))
        : 0;
      return `${days} workday${days === 1 ? "" : "s"} × ${formatPayrollHours(perDay)}`;
    },
    accent: [59, 130, 246],
  },
  {
    label: "Worked",
    value: (it) => formatPayrollHours(it.worked_hours),
    hint: () => "Tracked time",
    accent: PDF_PALETTE.brand,
  },
  {
    label: "Leave",
    value: (it) => formatPayrollHours(it.leave_hours),
    hint: () => "Approved leave",
    accent: [234, 179, 8],
  },
  {
    label: "Holiday",
    value: (it) => formatPayrollHours(it.holiday_hours),
    hint: (it) => {
      const count =
        snapshotNumber(it.calculation_snapshot, "weekday_holiday_count") ??
        Math.max(0, Math.round(it.holiday_hours / perDayHours(it)));
      return `${count} weekday holiday${count === 1 ? "" : "s"}`;
    },
    accent: [139, 92, 246],
  },
  {
    label: "Overtime",
    value: (it) => formatPayrollHours(it.overtime_hours),
    hint: (it) => `× ${it.overtime_multiplier || 1} multiplier`,
    accent: [236, 72, 153],
  },
  {
    label: "Payable",
    value: (it) => formatPayrollHours(it.payable_hours),
    hint: () => "Basis for pay",
    accent: PDF_PALETTE.heading,
  },
];

/** Six hour cells in a 3×2 grid, so the derivation of payable hours is visible. */
const drawHoursGrid = (
  doc: jsPDF,
  item: EmployeePayroll,
  top: number,
) => {
  drawText(doc, "HOURS SUMMARY", PAGE_MARGIN, top, {
    size: 8,
    bold: true,
    color: PDF_PALETTE.heading,
  });

  const gridTop = top + 10;
  const gap = 10;
  const columns = 3;
  const cardW = (CONTENT_WIDTH - gap * (columns - 1)) / columns;
  const cardH = 50;

  HOUR_CELLS.forEach((cell, idx) => {
    const x = PAGE_MARGIN + (idx % columns) * (cardW + gap);
    const y = gridTop + Math.floor(idx / columns) * (cardH + gap);

    drawCard(doc, x, y, cardW, cardH, { accent: cell.accent });
    drawText(doc, cell.label.toUpperCase(), x + 12, y + 16, { size: 7.5, bold: true });
    drawText(doc, cell.value(item), x + 12, y + 32, {
      size: 12,
      bold: true,
      color: PDF_PALETTE.heading,
    });
    drawText(doc, truncateToWidth(doc, cell.hint(item), cardW - 20, 7), x + 12, y + 43, {
      size: 7,
    });
  });

  return gridTop + Math.ceil(HOUR_CELLS.length / columns) * (cardH + gap) - gap;
};

type EarningsRow = [string, string, string];

/**
 * The earnings ledger, built as data so the total row can never disagree with
 * the lines above it.
 *
 * Bonus and waiver amounts print in the LINE's own currency — the backend does
 * not convert them — and unapplied bonuses are listed without a `+` so they can
 * never read as money paid.
 */
const buildEarningsRows = (item: EmployeePayroll): EarningsRow[] => {
  const { appliedBonuses, staleBonuses } = splitAdjustments(item);
  const money = (amount: number | null | undefined, currency?: string | null) =>
    formatPayrollMoney(amount, currency ?? item.currency);

  const rows: EarningsRow[] = [
    [
      "Basic salary",
      item.salary_type === "hourly"
        ? `${money(item.hourly_rate)} / hr × ${formatPayrollHours(item.payable_hours)}`
        : "Monthly fixed salary",
      money(item.basic_salary),
    ],
  ];

  if (Number(item.overtime_amount || 0) > 0) {
    rows.push([
      "Overtime",
      `${formatPayrollHours(item.overtime_hours)} × ${item.overtime_multiplier || 1}`,
      `+ ${money(item.overtime_amount)}`,
    ]);
  }

  if (Number(item.deduction_amount || 0) > 0) {
    rows.push(["Deduction", "Shortfall against target hours", `- ${money(item.deduction_amount)}`]);
  }

  if (item.deduction_waived) {
    rows.push([
      "Deduction waived",
      "Approved by payroll — deduction added back",
      `+ ${money(item.waived_amount)}`,
    ]);
  }

  appliedBonuses.forEach((line) => {
    rows.push([line.title, "Bonus", `+ ${money(line.amount, line.currency)}`]);
  });

  staleBonuses.forEach((line) => {
    rows.push([
      line.title,
      "Not applied — currency changed",
      money(line.amount, line.currency),
    ]);
  });

  return rows;
};

/* ---------------- entry point ---------------- */

/**
 * Builds and downloads a single employee's payslip as an A4 portrait PDF.
 *
 * `employee` is passed in because `/payroll/history` does not embed the user
 * object — the caller supplies it from the logged-in user store.
 */
export const downloadPayslipPdf = async (
  item: EmployeePayroll,
  employee: PayslipEmployee = {},
) => {
  try {
    const { JsPDF, autoTable } = await loadPdfLibs();
    const doc = new JsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    drawMasthead(doc, item);
    const afterIdentity = drawIdentityBlock(doc, item, employee);
    const afterNet = drawNetPayBand(doc, item, afterIdentity + 16);
    const afterHours = drawHoursGrid(doc, item, afterNet + 26);

    drawText(doc, "EARNINGS & DEDUCTIONS", PAGE_MARGIN, afterHours + 26, {
      size: 8,
      bold: true,
      color: PDF_PALETTE.heading,
    });

    const rows = buildEarningsRows(item);

    autoTable(doc, {
      startY: afterHours + 36,
      head: [["Description", "Basis", "Amount"]],
      body: rows,
      foot: [
        ["Gross salary", "", formatPayrollMoney(item.gross_salary, item.currency)],
        ["Net pay", "", formatPayrollMoney(item.final_salary, item.currency)],
      ],
      margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
      ...TABLE_STYLES,
      columnStyles: {
        0: { cellWidth: 170, fontStyle: "bold" },
        1: { textColor: PDF_PALETTE.subtext, fontSize: 8 },
        2: { halign: "right", cellWidth: 110, fontStyle: "bold" },
      },
      footStyles: {
        fillColor: PDF_PALETTE.softBg,
        textColor: PDF_PALETTE.heading,
        fontStyle: "bold",
        fontSize: 9.5,
        cellPadding: 7,
        lineColor: PDF_PALETTE.border,
        lineWidth: 0.4,
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 2) {
          const value = String(data.cell.raw ?? "");
          if (value.startsWith("+")) data.cell.styles.textColor = PDF_PALETTE.positive;
          if (value.startsWith("-")) data.cell.styles.textColor = PDF_PALETTE.negative;
        }
        // Grey out the "not applied" lines entirely so they read as context.
        if (data.section === "body" && rows[data.row.index]?.[1].startsWith("Not applied")) {
          data.cell.styles.textColor = PDF_PALETTE.muted;
        }
        // Net pay is the last foot row — give it the brand colour and more weight.
        if (data.section === "foot" && data.row.index === 1) {
          data.cell.styles.textColor = PDF_PALETTE.brand;
          data.cell.styles.fontSize = 12;
        }
      },
    });

    let y = lastTableBottom(doc, afterHours + 36) + 18;

    // final_salary can legitimately exceed gross_salary; say why rather than
    // letting it read as a bug.
    if (Number(item.final_salary || 0) > Number(item.gross_salary || 0)) {
      drawText(
        doc,
        "Net pay exceeds gross because bonuses and/or a waived deduction were applied after the gross calculation.",
        PAGE_MARGIN,
        y,
        { size: 8 },
      );
      y += 18;
    }

    if (item.notes) {
      y = drawNotesBlock(doc, item.notes, y) + 18;
    }

    drawFooter(doc, DISCLAIMER);

    const period = item.payrollRun
      ? slugify(formatPayrollPeriod(item.payrollRun.month, item.payrollRun.year))
      : String(item.id);
    const owner = employee.name ? `${slugify(employee.name)}-` : "";

    doc.save(`payslip-${owner}${period}.pdf`);
    toast.success("Payslip downloaded.");
  } catch (error) {
    toast.error(
      error instanceof Error ? error.message : "Failed to build your payslip PDF.",
    );
  }
};
