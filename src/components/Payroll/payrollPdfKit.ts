import { format, parseISO } from "date-fns";
import type jsPDF from "jspdf";

import type { PayrollRunStatus } from "@/types/payroll";

/**
 * Drawing primitives shared by every payroll PDF (the HR run report and the
 * employee payslip). Keeping the palette and the box/badge/footer routines here
 * means a brand tweak lands on both documents at once instead of drifting.
 */

export type Rgb = [number, number, number];

export const PDF_PALETTE = {
  brand: [18, 205, 105] as Rgb,
  heading: [15, 22, 19] as Rgb,
  subtext: [80, 85, 83] as Rgb,
  border: [220, 227, 227] as Rgb,
  softBg: [246, 247, 249] as Rgb,
  white: [255, 255, 255] as Rgb,
  positive: [16, 185, 129] as Rgb,
  negative: [220, 38, 38] as Rgb,
  muted: [148, 163, 175] as Rgb,
} as const;

export const STATUS_COLOR: Record<PayrollRunStatus | string, Rgb> = {
  draft: [100, 116, 139],
  generated: [59, 130, 246],
  approved: [16, 185, 129],
  paid: [139, 92, 246],
};

/** A4 in points, for both orientations. */
export const A4_PORTRAIT = { width: 595.28, height: 841.89 } as const;

export const PAGE_MARGIN = 40;

/* ---------------- dates ---------------- */

const formatOrRaw = (value: string | null | undefined, pattern: string) => {
  if (!value) return "—";
  try {
    return format(parseISO(value), pattern);
  } catch {
    return value;
  }
};

export const safeDate = (value?: string | null) =>
  formatOrRaw(value, "MMM d, yyyy h:mm a");

export const shortDate = (value?: string | null) =>
  formatOrRaw(value, "MMM d, yyyy");

/**
 * Joins two dates with an en dash, not an arrow: jsPDF's built-in Helvetica is
 * WinAnsi-encoded and renders U+2192 as garbage.
 */
export const dateRange = (start?: string | null, end?: string | null) =>
  `${shortDate(start)} – ${shortDate(end)}`;

/* ---------------- text ---------------- */

interface TextOptions {
  size?: number;
  bold?: boolean;
  color?: Rgb;
  align?: "left" | "center" | "right";
}

/**
 * Sets font + colour and draws in one call. Every draw routine goes through
 * this, so no routine can leak a font state onto the next one by forgetting to
 * reset it.
 */
export const drawText = (
  doc: jsPDF,
  text: string | string[],
  x: number,
  y: number,
  { size = 9, bold = false, color = PDF_PALETTE.subtext, align }: TextOptions = {},
) => {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(text, x, y, align ? { align } : undefined);
};

/** Truncates with an ellipsis so long names can't collide with the value beside them. */
export const truncateToWidth = (
  doc: jsPDF,
  text: string,
  maxWidth: number,
  size: number,
  bold = false,
) => {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  if (doc.getTextWidth(text) <= maxWidth) return text;

  let clipped = text;
  while (clipped.length > 1 && doc.getTextWidth(`${clipped}…`) > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped}…`;
};

/* ---------------- shapes ---------------- */

export const drawTopBrandBar = (doc: jsPDF, height = 6) => {
  doc.setFillColor(...PDF_PALETTE.brand);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), height, "F");
};

interface CardOptions {
  fill?: Rgb;
  border?: Rgb;
  radius?: number;
  /** Draws a coloured spine on the left edge — used for stat cards. */
  accent?: Rgb;
}

export const drawCard = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  { fill = PDF_PALETTE.white, border = PDF_PALETTE.border, radius = 6, accent }: CardOptions = {},
) => {
  doc.setFillColor(fill[0], fill[1], fill[2]);
  doc.setDrawColor(border[0], border[1], border[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(x, y, width, height, radius, radius, "FD");

  if (accent) {
    doc.setFillColor(accent[0], accent[1], accent[2]);
    doc.roundedRect(x, y, 3, height, 1.5, 1.5, "F");
  }
};

/** Right-aligned pill. Returns its left edge so callers can stack badges. */
export const drawBadge = (
  doc: jsPDF,
  label: string,
  rightX: number,
  y: number,
  color: Rgb,
  { size = 9, height = 18 }: { size?: number; height?: number } = {},
) => {
  const text = label.toUpperCase();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(size);

  const padX = 10;
  const width = doc.getTextWidth(text) + padX * 2;
  const x = rightX - width;

  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(x, y, width, height, height / 2, height / 2, "F");
  drawText(doc, text, x + padX, y + height / 2 + size / 3, {
    size,
    bold: true,
    color: PDF_PALETTE.white,
  });

  return x;
};

export const drawDivider = (doc: jsPDF, y: number, marginX = PAGE_MARGIN) => {
  doc.setDrawColor(...PDF_PALETTE.border);
  doc.setLineWidth(0.6);
  doc.line(marginX, y, doc.internal.pageSize.getWidth() - marginX, y);
};

/** Renders a notes panel that grows with its content. Returns the y below it. */
export const drawNotesBlock = (
  doc: jsPDF,
  notes: string,
  startY: number,
  marginX = PAGE_MARGIN,
) => {
  const boxWidth = doc.internal.pageSize.getWidth() - marginX * 2;
  const wrapped = doc.splitTextToSize(notes, boxWidth - 20) as string[];
  const boxHeight = 18 + wrapped.length * 12;

  doc.setFillColor(...PDF_PALETTE.softBg);
  doc.setDrawColor(...PDF_PALETTE.border);
  doc.roundedRect(marginX, startY, boxWidth, boxHeight, 6, 6, "FD");

  drawText(doc, "NOTES", marginX + 10, startY + 14, {
    size: 9,
    bold: true,
    color: PDF_PALETTE.heading,
  });
  drawText(doc, wrapped, marginX + 10, startY + 28, { size: 9 });

  return startY + boxHeight;
};

/**
 * Stamps every page with the generation time, an optional disclaimer and a
 * page counter. Call last — it walks pages that autoTable may have added.
 */
export const drawFooter = (doc: jsPDF, disclaimer?: string) => {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const generated = format(new Date(), "MMM d, yyyy h:mm a");

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawDivider(doc, pageHeight - 32);
    drawText(doc, `Generated ${generated}`, PAGE_MARGIN, pageHeight - 18, { size: 8 });

    if (disclaimer) {
      drawText(doc, disclaimer, pageWidth / 2, pageHeight - 18, {
        size: 8,
        align: "center",
        color: PDF_PALETTE.muted,
      });
    }

    drawText(doc, `Page ${page} of ${pageCount}`, pageWidth - PAGE_MARGIN, pageHeight - 18, {
      size: 8,
      align: "right",
    });
  }
};

/* ---------------- autoTable ---------------- */

/** `lastAutoTable` is attached by the plugin at runtime and isn't on jsPDF's type. */
export const lastTableBottom = (doc: jsPDF, fallback: number) =>
  (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ??
  fallback;

/** Base autoTable styling so both documents share one table look. */
export const TABLE_STYLES = {
  styles: {
    font: "helvetica",
    fontSize: 8.5,
    cellPadding: 6,
    textColor: PDF_PALETTE.heading,
    lineColor: PDF_PALETTE.border,
    lineWidth: 0.4,
    valign: "middle",
  },
  headStyles: {
    fillColor: PDF_PALETTE.heading,
    textColor: PDF_PALETTE.white,
    fontStyle: "bold",
    fontSize: 8.5,
    cellPadding: 7,
  },
  bodyStyles: { fillColor: PDF_PALETTE.white },
  alternateRowStyles: { fillColor: PDF_PALETTE.softBg },
} as const;

/* ---------------- loading + saving ---------------- */

/**
 * Loads jspdf and its autotable plugin together; both are import()ed so the
 * ~350kB stays out of the main bundle.
 *
 * Reads the named exports rather than `default` — they resolve identically in
 * the ESM and CJS builds, so this survives whichever one the bundler picks.
 */
export const loadPdfLibs = async () => {
  const [jspdfModule, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  return {
    JsPDF: jspdfModule.jsPDF,
    autoTable: autoTableModule.autoTable ?? autoTableModule.default,
  };
};

/** Lowercases and hyphenates a filename fragment. */
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
