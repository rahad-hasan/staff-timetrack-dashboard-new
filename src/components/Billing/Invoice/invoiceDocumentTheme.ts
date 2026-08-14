/**
 * The invoice document's colour tokens — the same palette as our transactional
 * emails and the PDF exporter (docs/frontend-invoice-integration.md §5).
 *
 * These are deliberately theme-INDEPENDENT: the document is paper, and it looks
 * the same on screen, on the printer and in the exported PDF. Using `dark:`
 * variants here would mean the on-screen document and its printed copy disagree,
 * and would make the rendered colour depend on how Tailwind happens to order the
 * `dark` and `print` variants in its output.
 *
 * Every value is a complete literal string so Tailwind's scanner picks it up.
 */
export const DOC = {
  paper: "bg-white",
  /** Headings and strong text. */
  heading: "text-[#2d3748]",
  /** Body copy. */
  body: "text-[#4a5568]",
  /** Periods, column labels. */
  muted: "text-[#718096]",
  /** Footer, disclaimers. */
  faint: "text-[#a0aec0]",
  /** Brand accent. */
  accent: "text-[#2b6cb0]",
  /** Strong table rule (header underline, totals divider). */
  rule: "border-[#e2e8f0]",
  /** Light table rule (between line items). */
  ruleSoft: "border-[#edf2f7]",
  /** Credits — negative prorations and refunds. */
  credit: "text-[#2f855a]",
} as const;
