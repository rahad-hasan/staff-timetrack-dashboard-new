/**
 * Invoice PDF design tokens — the same palette our transactional emails use, so
 * a mailed receipt and a downloaded invoice look like one document
 * (docs/frontend-invoice-integration.md §5).
 */

export type Rgb = [number, number, number];

export const INVOICE_PDF_PALETTE = {
  /** Headings and strong text. */
  heading: [45, 55, 72] as Rgb, // #2d3748
  /** Body copy. */
  body: [74, 85, 104] as Rgb, // #4a5568
  /** Periods, secondary labels. */
  muted: [113, 128, 150] as Rgb, // #718096
  /** Footer, disclaimers. */
  faint: [160, 174, 192] as Rgb, // #a0aec0
  /** Brand accent. */
  brand: [43, 108, 176] as Rgb, // #2b6cb0
  /** Table rules. */
  rule: [226, 232, 240] as Rgb, // #e2e8f0
  ruleSoft: [237, 242, 247] as Rgb, // #edf2f7
  white: [255, 255, 255] as Rgb,
  /** Credits / negative line amounts. */
  credit: [47, 133, 90] as Rgb,
  /** Voided + outstanding-balance emphasis. */
  alert: [197, 48, 48] as Rgb,
} as const;

/** A4 portrait, in points — jsPDF is created with `unit: "pt"`. */
export const PAGE = { width: 595.28, height: 841.89 } as const;

export const MARGIN = 44;

export const CONTENT_WIDTH = PAGE.width - MARGIN * 2;

/**
 * Band reserved at the foot of every page for the divider, generation stamp and
 * "Page N of M". autoTable is given this as its bottom margin so a table page
 * break can never land a row on top of the footer.
 */
export const FOOTER_RESERVE = 56;

/** Lowest y a section may occupy before it has to move to the next page. */
export const CONTENT_BOTTOM = PAGE.height - FOOTER_RESERVE;
