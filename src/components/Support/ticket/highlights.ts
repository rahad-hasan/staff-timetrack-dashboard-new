/**
 * Rating highlight chips (§4.4 vocabulary, blueprint Q23), as TD-06 draws
 * them on the rating card: "✓ Quick response" blue on pale blue, "✓ Solved
 * my issue" green on pale green (appendix TD-06 sheet). The three chips the
 * screens never show take the tone of their kind: how the agent helped
 * (manner) → blue, what the help achieved (outcome) → green.
 *
 * Fills and borders are TD-06's measured values; the text uses AA-safe
 * shades: blue-700 #1447e6 (6.1 : 1) and green-800 #016630 (6.3 : 1 —
 * green-700 #008236 reads only 4.39 : 1 on TD-06's #e7f5ea). TD-06's own
 * #3679f5 / #0d9f2d read 3.6 / 3.1 : 1 at 12px.
 */

import { FEEDBACK_HIGHLIGHT_LABELS, type FeedbackHighlight } from "@/types/support";

export type HighlightTone = "blue" | "green";

export const HIGHLIGHT_TONE: Record<FeedbackHighlight, HighlightTone> = {
  quick_response: "blue",
  solved_my_issue: "green",
  friendly: "blue",
  clear_explanation: "blue",
  knowledgeable: "green",
};

export const HIGHLIGHT_TONE_CLASS: Record<HighlightTone, string> = {
  blue: "border-[#c7dafc] bg-[#ebf2fe] text-[#1447e6] dark:border-[#2b7fff]/40 dark:bg-[#2b7fff]/15 dark:text-support-primary-text-dark",
  green: "border-[#bbe4c4] bg-[#e7f5ea] text-[#016630] dark:border-[#00c950]/40 dark:bg-[#00c950]/15 dark:text-[#7bf1a8]",
};

const isHighlight = (value: string): value is FeedbackHighlight =>
  Object.prototype.hasOwnProperty.call(FEEDBACK_HIGHLIGHT_LABELS, value);

/** Label of a stored highlight; an unknown (newer) value is shown humanised rather than dropped. */
export const highlightLabel = (value: string): string =>
  isHighlight(value) ? FEEDBACK_HIGHLIGHT_LABELS[value] : value.replace(/_/g, " ");

/** Chip classes of a stored highlight (unknown values take the blue tone). */
export const highlightToneClass = (value: string): string =>
  HIGHLIGHT_TONE_CLASS[isHighlight(value) ? HIGHLIGHT_TONE[value] : "blue"];
