import type jsPDF from "jspdf";
import type { CellHookData, Color } from "jspdf-autotable";

import { formatCents } from "@/lib/billing";
import {
  buildTotalsLadder,
  collectInvoiceText,
  formatInvoiceDate,
  formatLinePeriod,
  invoicePdfFileName,
  invoiceProductName,
  lineDescription,
} from "@/lib/invoice";
import { loadPdfLibs } from "@/components/Payroll/payrollPdfKit";
import { IBillingInvoiceDetail, IInvoiceLine } from "@/types/billing";

import { LOGO_ASPECT_RATIO, loadLogoDataUrl } from "./invoicePdfAssets";
import {
  CONTENT_BOTTOM,
  CONTENT_WIDTH,
  FOOTER_RESERVE,
  INVOICE_PDF_PALETTE as C,
  MARGIN,
  PAGE,
  type Rgb,
} from "./invoicePdfTheme";
import {
  canRasterize,
  documentNeedsRaster,
  drawLines,
  drawText,
  needsRaster,
  textWidth,
  truncateToWidth,
  wrapText,
} from "./invoicePdfText";

/**
 * Client-side invoice PDF. The backend deliberately does not render PDFs — it
 * returns every value the document needs and this builds the paper.
 *
 * The layout is a faithful reproduction of the reference invoice
 * (docs/frontend-invoice-integration.md §5, and the Hubstaff document it points
 * at) with our seller block, branding and palette: title left / wordmark right,
 * a four-row meta stack, seller and "Bill to" columns splitting the page in
 * half, a four-column itemisation, and a totals ladder occupying the right half
 * with a rule above every row.
 *
 * Two contracts are honoured verbatim on top of that:
 *   • money is printed from the server's `*_cents` values, and the ladder comes
 *     from `totals` — the lines are pre-discount/pre-tax and are never summed
 *     into a total;
 *   • when the document runs to more than one page the column header repeats
 *     and every page carries a footer with "Page N of M".
 *
 * Non-Latin text is handled by invoicePdfText's canvas path, so a Bengali
 * company name renders as real Bengali rather than tofu.
 */

/* ---------------- layout ---------------- */

/**
 * The reference splits the page in half: the "Bill to" column, the Quantity
 * column and the totals ladder all start at the same x.
 */
const HALF = CONTENT_WIDTH / 2;
const MID_X = MARGIN + HALF;
const RIGHT_X = PAGE.width - MARGIN;

const COL_DESCRIPTION = HALF;
const COL_QUANTITY = 86;
const COL_UNIT_PRICE = 81;
const COL_TOTAL = CONTENT_WIDTH - COL_DESCRIPTION - COL_QUANTITY - COL_UNIT_PRICE;

const BODY_SIZE = 9;
const LINE_STEP = 13;
/** autoTable's own line ratio — the custom cell painter must match it. */
const TABLE_LINE_RATIO = 1.15;
const CELL_PAD_Y = 7;
/** Keeps a long description clear of the Quantity column. */
const DESCRIPTION_GUTTER = 12;

const TOTALS_ROW_STEP = 22;
/** Rule-to-baseline offset inside a totals row. */
const TOTALS_TEXT_OFFSET = 13;

/* ---------------- primitives ---------------- */

const rule = (doc: jsPDF, y: number, x1: number, x2: number) => {
  doc.setDrawColor(C.rule[0], C.rule[1], C.rule[2]);
  doc.setLineWidth(0.7);
  doc.line(x1, y, x2, y);
};

const toRgb = (color: Color | undefined, fallback: Rgb): Rgb => {
  if (typeof color === "number") return [color, color, color];
  if (Array.isArray(color) && color.length >= 3) {
    return [Number(color[0]), Number(color[1]), Number(color[2])];
  }
  return fallback;
};

/* ---------------- sections ---------------- */

/**
 * "Invoice" on the left, logo + product name on the right.
 *
 * No status chip in the normal case — the reference document carries none. The
 * one exception is a voided invoice, which the guide requires to be badged, and
 * which nothing else on the page would otherwise reveal.
 */
const drawMasthead = (
  doc: jsPDF,
  invoice: IBillingInvoiceDetail,
  logoDataUrl: string | null,
) => {
  const titleBaseline = MARGIN + 20;

  drawText(doc, "Invoice", MARGIN, titleBaseline, {
    size: 20,
    bold: true,
    color: C.heading,
  });

  if (invoice.voided) {
    const label = "VOIDED";
    const size = 7.5;
    const padX = 7;
    const height = 15;
    const width = textWidth(doc, label, { size, bold: true }) + padX * 2;
    const x = MARGIN + textWidth(doc, "Invoice", { size: 20, bold: true }) + 10;

    doc.setFillColor(C.muted[0], C.muted[1], C.muted[2]);
    doc.roundedRect(x, titleBaseline - 11, width, height, height / 2, height / 2, "F");
    drawText(doc, label, x + padX, titleBaseline - 11 + height / 2 + size * 0.36, {
      size,
      bold: true,
      color: C.white,
    });
  }

  const productName = invoiceProductName(invoice.seller);
  const nameWidth = textWidth(doc, productName, { size: 13, bold: true });
  const logoHeight = logoDataUrl ? 20 : 0;
  const logoWidth = logoDataUrl ? logoHeight * LOGO_ASPECT_RATIO : 0;
  const gap = logoDataUrl ? 6 : 0;
  const blockLeft = RIGHT_X - (logoWidth + gap + nameWidth);

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, "PNG", blockLeft, titleBaseline - 15, logoWidth, logoHeight);
  }
  // Dark wordmark beside a coloured mark, as in the reference — the logo
  // carries the brand colour, the text does not.
  drawText(doc, productName, blockLeft + logoWidth + gap, titleBaseline, {
    size: 13,
    bold: true,
    color: C.heading,
  });
};

/**
 * Invoice number / date of issue / date due / transaction date. The reference
 * bolds only the first label; rows with no value are dropped, which is what
 * removes "Transaction date" from an unpaid invoice.
 */
const drawMetaBlock = (doc: jsPDF, invoice: IBillingInvoiceDetail): number => {
  const entries: Array<[string, string]> = (
    [
      ["Invoice number", invoice.invoice_number],
      // `date_of_issue`, never `created_at`.
      ["Date of issue", formatInvoiceDate(invoice.date_of_issue) ?? ""],
      ["Date due", formatInvoiceDate(invoice.date_due) ?? ""],
      ["Transaction date", formatInvoiceDate(invoice.transaction_date) ?? ""],
    ] as Array<[string, string]>
  ).filter((entry) => Boolean(entry[1]));

  const valueX = MARGIN + 82;
  const valueWidth = RIGHT_X - valueX;

  let y = MARGIN + 50;
  entries.forEach(([label, value], index) => {
    const valueStyle = { size: BODY_SIZE, color: C.heading } as const;
    drawText(doc, label, MARGIN, y, {
      size: BODY_SIZE,
      bold: index === 0,
      color: C.heading,
    });
    drawText(doc, truncateToWidth(doc, value, valueWidth, valueStyle), valueX, y, valueStyle);
    y += LINE_STEP;
  });

  return y - LINE_STEP;
};

/**
 * Seller on the left, "Bill to" on the right, splitting the page in half.
 *
 * The seller's name and the "Bill to" heading share the first baseline — that
 * is why the seller column has no heading of its own and the bill-to name sits
 * one line lower, exactly as in the reference.
 */
const drawParties = (
  doc: jsPDF,
  invoice: IBillingInvoiceDetail,
  startY: number,
): number => {
  const columnWidth = HALF - 16;
  const { seller, bill_to: billTo } = invoice;

  const drawColumn = (
    x: number,
    rows: Array<{ text: string | null | undefined; bold?: boolean }>,
  ): number => {
    let y = startY;
    rows.forEach((row) => {
      const text = row.text?.trim();
      if (!text) return;
      const style = { size: BODY_SIZE, bold: row.bold, color: C.heading };
      // Advance on the document's own 13pt rhythm rather than the text
      // engine's line height, so both columns stay on the same baselines
      // however their contents wrap.
      wrapText(doc, text, columnWidth, style).forEach((line) => {
        drawText(doc, line, x, y, style);
        y += LINE_STEP;
      });
    });
    return y - LINE_STEP;
  };

  const leftBottom = drawColumn(MARGIN, [
    { text: seller?.name, bold: true },
    ...(seller?.address_lines ?? []).map((text) => ({ text })),
    { text: seller?.phone },
    { text: seller?.support_email },
  ]);

  const rightBottom = drawColumn(MID_X, [
    { text: "Bill to", bold: true },
    {
      text: billTo?.company_id
        ? `${billTo.name} (ID: ${billTo.company_id})`
        : billTo?.name,
    },
    { text: billTo?.address },
    { text: billTo?.email },
  ]);

  return Math.max(leftBottom, rightBottom);
};

interface DescriptionCell {
  /** The description itself, pre-wrapped to the column. */
  main: string[];
  /** The service period (and proration tag), drawn muted beneath it. */
  sub: string[];
}

const buildDescriptionCell = (
  doc: jsPDF,
  line: IInvoiceLine,
  planName: string | null | undefined,
): DescriptionCell => {
  const innerWidth = COL_DESCRIPTION - DESCRIPTION_GUTTER;
  const subText = [formatLinePeriod(line), line.proration ? "Proration" : null]
    .filter(Boolean)
    .join(" · ");

  return {
    main: wrapText(doc, lineDescription(line, planName), innerWidth, {
      size: BODY_SIZE,
      bold: true,
    }),
    sub: subText ? wrapText(doc, subText, innerWidth, { size: BODY_SIZE }) : [],
  };
};

/**
 * The itemisation. `showHead: "everyPage"` satisfies the repeated-column-header
 * requirement, and `margin.bottom` keeps rows out of the footer band.
 *
 * Every BODY cell is painted by hand rather than by autoTable: it is the only
 * way to give the period line its own muted style, and it routes non-Latin
 * strings through the canvas path so they survive the export. Cell text is
 * pre-wrapped with the same engine that draws it, so autoTable still measures
 * row heights correctly.
 */
const drawLinesTable = (
  doc: jsPDF,
  autoTable: Awaited<ReturnType<typeof loadPdfLibs>>["autoTable"],
  invoice: IBillingInvoiceDetail,
  startY: number,
): number => {
  const lines = invoice.lines ?? [];
  if (!lines.length) {
    drawText(
      doc,
      "This invoice has no itemised lines. The totals below are still complete.",
      MARGIN,
      startY + 14,
      { size: BODY_SIZE, color: C.muted },
    );
    return startY + 24;
  }

  const descriptions = lines.map((line) =>
    buildDescriptionCell(doc, line, invoice.plan_name),
  );
  const lastRowIndex = lines.length - 1;

  const body = lines.map((line, index) => [
    [...descriptions[index].main, ...descriptions[index].sub].join("\n"),
    line.quantity === null || line.quantity === undefined ? "" : String(line.quantity),
    line.unit_amount_cents === null || line.unit_amount_cents === undefined
      ? ""
      : formatCents(line.unit_amount_cents, line.currency),
    // Always `amount_cents` — on a proration row quantity × unit price does not
    // reach it, and it may be a negative credit.
    formatCents(line.amount_cents, line.currency),
  ]);

  /** Cells whose text was lifted out of autoTable so it could be drawn by hand. */
  const handDrawn = new Map<
    object,
    { lines: string[]; mainCount: number; mainBold: boolean }
  >();

  autoTable(doc, {
    startY,
    theme: "plain",
    head: [["Description", "Quantity", "Unit price", "Total"]],
    body,
    margin: { top: MARGIN, bottom: FOOTER_RESERVE, left: MARGIN, right: MARGIN },
    showHead: "everyPage",
    // A split row would hand `didDrawCell` a remainder cell whose text this
    // module already lifted out — keep rows whole and let them move as a unit.
    rowPageBreak: "avoid",
    styles: {
      font: "helvetica",
      fontSize: BODY_SIZE,
      cellPadding: { top: CELL_PAD_Y, right: 0, bottom: CELL_PAD_Y, left: 0 },
      textColor: C.heading,
      lineWidth: 0,
      overflow: "visible",
    },
    headStyles: { fontStyle: "bold", textColor: C.heading, valign: "middle" },
    columnStyles: {
      0: {
        cellWidth: COL_DESCRIPTION,
        halign: "left",
        valign: "top",
        cellPadding: {
          top: CELL_PAD_Y,
          right: DESCRIPTION_GUTTER,
          bottom: CELL_PAD_Y,
          left: 0,
        },
      },
      // The reference left-aligns the two middle columns under their headers
      // and centres them against the two-line description.
      1: { cellWidth: COL_QUANTITY, halign: "left", valign: "middle" },
      2: { cellWidth: COL_UNIT_PRICE, halign: "left", valign: "middle" },
      3: { cellWidth: COL_TOTAL, halign: "right", valign: "middle" },
    },
    didParseCell: (data: CellHookData) => {
      // columnStyles are applied to body cells only, so the header row has to
      // be told about the Total column's right alignment separately.
      if (data.section === "head") {
        if (data.column.index === 3) data.cell.styles.halign = "right";
        return;
      }
      if (data.section !== "body") return;
      if (data.column.index === 3 && lines[data.row.index]?.amount_cents < 0) {
        data.cell.styles.textColor = C.credit;
      }
    },
    willDrawCell: (data: CellHookData) => {
      if (data.section === "body") {
        const description =
          data.column.index === 0 ? descriptions[data.row.index] : null;
        const cellLines = description
          ? [...description.main, ...description.sub]
          : data.cell.text;
        if (!cellLines.length) return;
        handDrawn.set(data.cell, {
          lines: cellLines,
          mainCount: description ? description.main.length : cellLines.length,
          // The description is the only bold thing in the body; everything else
          // takes the cell's own weight.
          mainBold: !!description,
        });
        data.cell.text = [];
        return;
      }
      // Head/foot are ours only when the core font cannot encode them.
      if (data.cell.text.some(needsRaster)) {
        handDrawn.set(data.cell, {
          lines: data.cell.text,
          mainCount: data.cell.text.length,
          mainBold: data.cell.styles.fontStyle === "bold",
        });
        data.cell.text = [];
      }
    },
    didDrawCell: (data: CellHookData) => {
      const entry = handDrawn.get(data.cell);
      if (entry) {
        handDrawn.delete(data.cell);
        const { styles } = data.cell;
        const size = styles.fontSize;
        const alignRight = styles.halign === "right";
        const x = alignRight
          ? data.cell.x + data.cell.width - data.cell.padding("right")
          : data.cell.x + data.cell.padding("left");

        // Mirror autoTable's own vertical placement: a top-aligned first
        // baseline sits at `y + padding.top + fontSize * (2 - 1.15)`, and a
        // middle-aligned block is centred in the cell's net height.
        const step = size * TABLE_LINE_RATIO;
        const padTop = data.cell.padding("top");
        let firstBaseline = data.cell.y + padTop + size * 0.85;
        if (styles.valign === "middle") {
          const netHeight = data.cell.height - data.cell.padding("vertical");
          firstBaseline =
            data.cell.y +
            netHeight / 2 +
            padTop +
            size * 0.85 -
            (entry.lines.length / 2) * step;
        }

        entry.lines.forEach((line, index) => {
          const isSub = index >= entry.mainCount;
          drawText(doc, line, x, firstBaseline + index * step, {
            size,
            bold: isSub ? false : entry.mainBold,
            color: isSub ? C.muted : toRgb(styles.textColor, C.heading),
            align: alignRight ? "right" : "left",
          });
        });
      }

      // One rule per row, drawn once (on the last column) across the full table
      // width — theme "plain" draws no borders of its own. The final row is
      // left open: the totals ladder's own top rule closes the table, and it
      // spans only the right half.
      if (data.column.index === 3) {
        const isFinalBodyRow =
          data.section === "body" && data.row.index === lastRowIndex;
        if (!isFinalBodyRow) {
          rule(doc, data.cell.y + data.cell.height, MARGIN, RIGHT_X);
        }
      }
    },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
    ?.finalY;
  return finalY ?? startY;
};

/** "Showing the first N items" note for a truncated snapshot. */
const drawTruncationNote = (
  doc: jsPDF,
  invoice: IBillingInvoiceDetail,
  startY: number,
): number => {
  const text = `Showing the first ${invoice.lines?.length ?? 0} items — this invoice has more, so the lines above do not add up to the subtotal. The totals below are complete.${
    invoice.hosted_invoice_url ? " See the full invoice on Stripe." : ""
  }`;
  const wrapped = wrapText(doc, text, CONTENT_WIDTH, { size: 8 });
  return drawLines(doc, wrapped, MARGIN, startY + 16, { size: 8, color: C.muted });
};

/**
 * The totals ladder: right half of the page, a rule above every row. Measured
 * first and pushed to a fresh page whole rather than allowed to split.
 */
const drawTotalsLadder = (
  doc: jsPDF,
  invoice: IBillingInvoiceDetail,
  startY: number,
): number => {
  const rows = buildTotalsLadder(invoice.totals, { voided: invoice.voided });
  const height = rows.length * TOTALS_ROW_STEP;

  let y = startY;
  if (y + height > CONTENT_BOTTOM) {
    doc.addPage();
    y = MARGIN;
  }

  rows.forEach((row) => {
    rule(doc, y, MID_X, RIGHT_X);
    const strong = row.tone === "strong";
    const baseline = y + TOTALS_TEXT_OFFSET;
    drawText(doc, row.label, MID_X, baseline, {
      size: BODY_SIZE,
      bold: strong,
      color: C.heading,
    });
    drawText(doc, formatCents(row.cents, invoice.currency), RIGHT_X, baseline, {
      size: BODY_SIZE,
      bold: strong,
      color: row.tone === "credit" ? C.credit : C.heading,
      align: "right",
    });
    y += TOTALS_ROW_STEP;
  });

  return y;
};

/**
 * Footer + "Page N of M", stamped on every page — but only once the document
 * actually runs to more than one page. A single-page invoice carries no footer,
 * matching the reference layout.
 */
const drawFooters = (doc: jsPDF, invoice: IBillingInvoiceDetail) => {
  const pageCount = doc.getNumberOfPages();
  if (pageCount < 2) return;

  const note = invoice.voided
    ? "This invoice has been voided and nothing is owed on it."
    : (invoice.seller?.support_email ?? "");

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    rule(doc, PAGE.height - 34, MARGIN, RIGHT_X);
    if (note) {
      drawText(doc, note, MARGIN, PAGE.height - 20, { size: 7.5, color: C.faint });
    }
    drawText(doc, `Page ${page} of ${pageCount}`, RIGHT_X, PAGE.height - 20, {
      size: 7.5,
      color: C.faint,
      align: "right",
    });
  }
};

/* ---------------- entry point ---------------- */

export interface InvoicePdfResult {
  fileName: string;
  /**
   * True when the document contains text the core font cannot encode AND the
   * canvas fallback was unavailable — the caller should point the user at
   * "Print / Save as PDF", which always renders every script correctly.
   */
  unicodeDegraded: boolean;
}

/**
 * Lays the whole document out and returns the jsPDF instance without saving it.
 * Split from the download so the layout can be exercised (and previewed)
 * without a browser download side effect.
 */
export const buildInvoicePdf = async (
  invoice: IBillingInvoiceDetail,
): Promise<{ doc: jsPDF } & InvoicePdfResult> => {
  const [{ JsPDF, autoTable }, logoDataUrl] = await Promise.all([
    loadPdfLibs(),
    loadLogoDataUrl(),
  ]);

  const doc = new JsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  const unicodeDegraded =
    documentNeedsRaster(collectInvoiceText(invoice)) && !canRasterize();

  drawMasthead(doc, invoice, logoDataUrl);
  const afterMeta = drawMetaBlock(doc, invoice);
  const afterParties = drawParties(doc, invoice, afterMeta + 30);

  const afterTable = drawLinesTable(doc, autoTable, invoice, afterParties + 26);
  const afterNote = invoice.lines_truncated
    ? drawTruncationNote(doc, invoice, afterTable)
    : afterTable;
  drawTotalsLadder(doc, invoice, afterNote);

  drawFooters(doc, invoice);

  return {
    doc,
    fileName: invoicePdfFileName(invoice.invoice_number),
    unicodeDegraded,
  };
};

/** Builds the invoice document and hands it to the browser as a download. */
export const downloadInvoicePdf = async (
  invoice: IBillingInvoiceDetail,
): Promise<InvoicePdfResult> => {
  const { doc, fileName, unicodeDegraded } = await buildInvoicePdf(invoice);
  doc.save(fileName);
  return { fileName, unicodeDegraded };
};
