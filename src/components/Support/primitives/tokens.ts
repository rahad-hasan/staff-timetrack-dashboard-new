/**
 * Support design tokens — measured on the user-portal PNG exports
 * (`backend/support-system/user-portal/*.png`, 2880×2048 = a 1440×1024
 * layout at 2×). Method (artifacts/step9a/plan.md §1): PIL pixel reads and
 * run-length scans at 2×, ÷2 for CSS px; corner radii from the border peak
 * along the 45° diagonal (calibrated on the app's own 8px content card and
 * the 16px table card); type sizes/weights by rendering the same strings in
 * Roboto 400/500/700 at candidate sizes and matching the ink box + pixel
 * difference. The palette is the app's own tokens (`globals.css`) plus the
 * Tailwind v4 colour scale the mock was drawn with, so the hex values below
 * are exact, not approximations.
 */

import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  CalendarSync,
  CircleQuestionMark,
  Mail,
  Monitor,
  Plug,
  Receipt,
  SquarePen,
  Timer,
} from "lucide-react";
import type {
  CategoryRef,
  SupportCategoryIcon,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/types/support";
import { CATEGORY_LABELS, PRIORITY_LABELS, STATUS_LABELS } from "@/types/support";

/* ───────────────────────────── palette ───────────────────────────── */

/*
 * The palette lives in ONE place: the CSS theme (`app/globals.css`, `@theme`). Components name it
 * by class — the app's own tokens and the support ones:
 *
 *   #0788f3 `primary` (app --primary)  borders, fills, icons, the Medium bars — graphics (3:1; 3.2–3.6)
 *   #066fc6 `support-primary-text`     AA twin of primary for small TEXT and for fills behind small
 *                                      white text (integrator decision 2026-10-21): TKT numbers, chips,
 *                                      "Clear all", the select value, the current pager square, links.
 *                                      #0788f3 reads 3.6:1 on white (axe "serious"); #066fc6 5.13, 4.54
 *                                      on the chip fill, 4.94 on the waiting tint. Revert = set
 *                                      --color-support-primary-text to #0788f3.
 *   #8ec5ff `support-primary-text-dark` the same in dark mode (≥ 8.9:1)
 *   #0f1613 `headingTextColor`         titles, headings, dropdown options, the footer range
 *   #505553 `subTextColor`             body copy, meta, the footer, chevrons, toast body
 *   #8a9190 `support-muted`            as drawn: placeholders-as-icons, ×, the replies glyph (3.2:1 —
 *                                      icons only)
 *   #697170 `support-muted-text`       AA twin of muted for TEXT: 5.0:1 on white, 4.67 on #f6f7f9, 4.57
 *                                      on #f3f5f5 (plan.md §7); the owner may revert
 *   #314158 `support-slate`            priority / assignee / replies / pager digits / Clear filters
 *   #dce3e3 `borderColor`              cards, inputs, the pager, unlit priority bars
 *   #e8ecec `support-divider`          table row dividers, the footer rule
 *   #f3f5f5 `support-surface-muted`    the arrow button, the selected dropdown row
 *   #c6d0d0 `support-border-hover`     input / select border on hover
 *   #f6f7f9 `bgSecondary`              the table header band (= page background)
 *   #e6f3fe / #f0f7fe `support-primary-soft` / `-tint`  primary at 10 % / 6 % on white
 *   glass `support-hero-glass(-hover|-active)`, `support-stats-glass` — see below
 *
 * The Tailwind-palette status / tone colours stay literal in the token tables below (they are the
 * v4 scale as drawn, written as hex so they match the PNGs exactly).
 *
 * `SUPPORT_COLORS` holds only the values code must pass as LITERALS — SVG presentation
 * attributes (stars) and computed tints — each equal to its CSS token.
 */
export const SUPPORT_COLORS = {
  /** amber-500 filled star */
  star: "#f59e0b",
  /** an empty star in the read-only list / card stars (= `borderColor`; decoration next to the number) */
  starEmpty: "#dce3e3",
  /**
   * An empty star of the rating INPUT (a required radio): its boundary must reach 3:1 (WCAG 1.4.11),
   * so the outline is `support-muted` #8a9190 (3.21:1 on white) around a `support-surface-muted` fill.
   */
  starInputEmptyStroke: "#8a9190",
  starInputEmptyFill: "#f3f5f5",
} as const;

/**
 * Hero band: a 146° two-stop gradient — fitted on 30 samples of UP-Default (max error 2/255 per
 * channel): #2c58c2 → #4a88e6, the end colour reached 80% along the 1440 band's gradient line
 * (687.7 of 859.6 px), flat #4a88e6 after it.
 *
 * AA fix (step-9a review, 2026-10-27): the stops are in PIXELS from the band's top-left, not in %.
 * For a 90–180° angle the top-left corner is always position 0 of the gradient line, so a px stop
 * gives every point the colour it has at 1440 whatever the band's width. 688 px = 80% of the 1440
 * band's 859.7 px line, so 1440 is unchanged; a % stop stretched the gradient with the band and
 * put lighter blue behind the subtitle and Refresh on 1024–1366 px laptops. With px stops solid
 * white stays ≥ 4.5:1 up to position 398 px, and the subtitle / Refresh ink ends near 370 at every
 * width. Revert = "…, #2c58c2 0%, #4a88e6 80%)".
 */
export const HERO_GRADIENT = "linear-gradient(146deg, #2c58c2 0px, #4a88e6 688px)";

/**
 * Filled CTA in the empty states (First use 44px tall, No results 40px). Drawn #4483e5 → #3260c8;
 * white 14px/500 on the drawn top colour is 3.73:1, so the top stop is the darker #3a70d6 (4.70:1;
 * the bottom #3260c8 is 5.76:1) — the same vertical sheen, one step deeper (step-9a review).
 * Revert = "#4483e5 0%".
 */
export const PRIMARY_BUTTON_GRADIENT = "linear-gradient(180deg, #3a70d6 0%, #3260c8 100%)";

/*
 * Glass on the hero (step-9a review, WCAG 1.4.3) — CSS tokens `support-stats-glass` (the card,
 * #0f2f7a @ 46 %) and `support-hero-glass` (the chip and Refresh, @ 12 %; hover 20 %, active 28 %).
 * Drawn as WHITE tints (white/10 card, white/14 chip, white/12 Refresh), which LIGHTEN the blue
 * under white text: the card's white/80 "All statuses" read 2.52:1, its white/90 legend labels
 * 2.78, the counts 3.1–3.3, the Live pill 3.06, the Refresh label ≈ 3.8 and the "Support" chip 4.3.
 * The deep-blue glass of the same family keeps the translucent look and darkens instead (computed
 * on the band's blues, then sampled live): white/80 4.58, white/90 5.32, white 6.14 on #4a88e6;
 * the Live pill and Retry chips on the card are white/12 (4.74); chip 6.28, Refresh ≥ 5.1.
 * Borders, radii and geometry are unchanged. Revert = the white tints named above.
 */

/* ───────────────────────────── focus ───────────────────────────── */

/**
 * The same ring on `[data-focus-ring]:focus` — for a programmatic focus Chrome does not treat as
 * :focus-visible (the auto-opened rating popup focuses its first star with no user input;
 * SupportDialog sets the attribute until blur / pointer use). WCAG 2.4.7.
 */
export const FOCUS_RING_FORCED_CLASSES =
  "data-[focus-ring]:focus:outline-solid data-[focus-ring]:focus:outline-2 data-[focus-ring]:focus:outline-offset-2 data-[focus-ring]:focus:outline-support-primary-text dark:data-[focus-ring]:focus:outline-support-primary-text-dark";

/**
 * The ONE keyboard focus indicator of the support screens (WCAG 2.4.7 + 1.4.11, step-9a review):
 * a solid 2px outline 2px outside the control. An outline (not a box-shadow ring) leaves the real
 * background visible in the 2px gap, so it stays distinct from blue-filled controls (the current
 * pager square, the primary CTA) and works on tinted surfaces and in dark mode. #066fc6 reads
 * 5.13:1 on white, 4.78 on #f6f7f9, 4.94 on the waiting tint; dark #8ec5ff ≥ 8.9:1. The drawn
 * translucent rings (#0788f3 at 20–50 %) measured 1.28–1.89:1. `outline-solid` is needed because
 * `outline-none` sets `--tw-outline-style: none`, which `outline-2` reads.
 */
export const FOCUS_RING =
  "focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-support-primary-text dark:focus-visible:outline-support-primary-text-dark " +
  FOCUS_RING_FORCED_CLASSES;

/** The same indicator on the blue hero / dark lightbox: solid white (≥ 3.5:1 on every hero blue). */
export const FOCUS_RING_ON_BLUE =
  "focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

/** The indicator drawn INSIDE the box (controls flush with a clipping edge, e.g. dialog chips). */
export const FOCUS_RING_INSET =
  "focus-visible:outline-solid focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-support-primary-text dark:focus-visible:outline-support-primary-text-dark";

/* ───────────────────────────── status ───────────────────────────── */

export interface StatusToken {
  value: TicketStatus;
  /** requester label (§4.1): `pending_customer` reads "Waiting on you" */
  label: string;
  /** bar segment, legend dot, dropdown dot, select-value dot, pill dot */
  dot: string;
  pillBg: string;
  pillBorder: string;
  pillText: string;
  /** Tailwind classes for the pill (light + dark) */
  pillClass: string;
  /** the pill's text colour as a class (light + dark) — status words inside a sentence */
  textClass: string;
}

/** Lifecycle order used by the legend, the bar and the dropdown (§4.1). */
export const STATUS_ORDER: TicketStatus[] = [
  "open",
  "in_progress",
  "pending_customer",
  "resolved",
  "closed",
];

export const STATUS_TOKENS: Record<TicketStatus, StatusToken> = {
  open: {
    value: "open",
    label: STATUS_LABELS.open,
    dot: "#2b7fff",
    pillBg: "#eff6ff",
    pillBorder: "#bedbff",
    pillText: "#1447e6",
    pillClass:
      "bg-[#eff6ff] border-[#bedbff] text-[#1447e6] dark:bg-[#2b7fff]/15 dark:border-[#2b7fff]/40 dark:text-support-primary-text-dark",
    textClass: "text-[#1447e6] dark:text-support-primary-text-dark",
  },
  in_progress: {
    value: "in_progress",
    label: STATUS_LABELS.in_progress,
    dot: "#f0b100",
    pillBg: "#fef9c2",
    pillBorder: "#fff085",
    pillText: "#bb4d00",
    pillClass:
      "bg-[#fef9c2] border-[#fff085] text-[#bb4d00] dark:bg-[#f0b100]/15 dark:border-[#f0b100]/40 dark:text-[#ffd230]",
    textClass: "text-[#bb4d00] dark:text-[#ffd230]",
  },
  pending_customer: {
    value: "pending_customer",
    label: STATUS_LABELS.pending_customer,
    dot: "#8e51ff",
    pillBg: "#f5f3ff",
    pillBorder: "#ddd6ff",
    pillText: "#7008e7",
    pillClass:
      "bg-[#f5f3ff] border-[#ddd6ff] text-[#7008e7] dark:bg-[#8e51ff]/20 dark:border-[#8e51ff]/45 dark:text-[#c4b4ff]",
    textClass: "text-[#7008e7] dark:text-[#c4b4ff]",
  },
  resolved: {
    value: "resolved",
    label: STATUS_LABELS.resolved,
    dot: "#00c950",
    pillBg: "#f0fdf4",
    pillBorder: "#b9f8cf",
    pillText: "#008236",
    pillClass:
      "bg-[#f0fdf4] border-[#b9f8cf] text-[#008236] dark:bg-[#00c950]/15 dark:border-[#00c950]/40 dark:text-[#7bf1a8]",
    textClass: "text-[#008236] dark:text-[#7bf1a8]",
  },
  closed: {
    value: "closed",
    label: STATUS_LABELS.closed,
    dot: "#99a1af",
    pillBg: "#f3f4f6",
    pillBorder: "#e5e7eb",
    pillText: "#364153",
    pillClass:
      "bg-[#f3f4f6] border-[#e5e7eb] text-[#364153] dark:bg-white/10 dark:border-white/20 dark:text-[#d1d5dc]",
    textClass: "text-[#364153] dark:text-[#d1d5dc]",
  },
};

/* ───────────────────────────── priority ───────────────────────────── */

export interface PriorityToken {
  value: TicketPriority;
  label: string;
  /** lit bars out of 4 */
  bars: 1 | 2 | 3 | 4;
  /** colour of the lit bars */
  color: string;
}

export const PRIORITY_TOKENS: Record<TicketPriority, PriorityToken> = {
  critical: { value: "critical", label: PRIORITY_LABELS.critical, bars: 4, color: "#fb2c36" },
  high: { value: "high", label: PRIORITY_LABELS.high, bars: 3, color: "#ff6900" },
  medium: { value: "medium", label: PRIORITY_LABELS.medium, bars: 2, color: "#0788f3" },
  low: { value: "low", label: PRIORITY_LABELS.low, bars: 1, color: "#99a1af" },
};

/** Unlit bar colour (`borderColor`). */
export const PRIORITY_BAR_OFF = "var(--color-borderColor)";

/** Bar heights (px) left→right, bottom-aligned; bars 3px wide, 2px gaps → glyph 18×14. */
export const PRIORITY_BAR_HEIGHTS = [5, 8, 11, 14] as const;

/* ───────────────────────────── categories ───────────────────────────── */

export const CATEGORY_ICON_MAP: Record<SupportCategoryIcon, LucideIcon> = {
  monitor: Monitor,
  stopwatch: Timer,
  plug: Plug,
  receipt: Receipt,
  calendar: Calendar,
  envelope: Mail,
  question: CircleQuestionMark,
  pencil: SquarePen,
  calendar_sync: CalendarSync,
};

/**
 * Seed table (§4.3) for rows whose `category_ref` is null (a deleted
 * category, or a v1 payload). Owner-created categories always arrive with
 * `category_ref`, so this never needs a client release.
 */
export const SEEDED_CATEGORIES: Record<
  TicketCategory,
  Pick<CategoryRef, "slug" | "name" | "icon" | "color">
> = {
  timer_issue: { slug: "timer_issue", name: CATEGORY_LABELS.timer_issue, icon: "stopwatch", color: "#0788F3" },
  manual_entry: { slug: "manual_entry", name: CATEGORY_LABELS.manual_entry, icon: "pencil", color: "#8E51FF" },
  calendar_sync: { slug: "calendar_sync", name: CATEGORY_LABELS.calendar_sync, icon: "calendar_sync", color: "#00BBA7" },
  billing_invoice: { slug: "billing_invoice", name: CATEGORY_LABELS.billing_invoice, icon: "receipt", color: "#F59E0B" },
  integration: { slug: "integration", name: CATEGORY_LABELS.integration, icon: "plug", color: "#615FFF" },
  desktop_app: { slug: "desktop_app", name: CATEGORY_LABELS.desktop_app, icon: "monitor", color: "#00A6F4" },
  general_inquiry: { slug: "general_inquiry", name: CATEGORY_LABELS.general_inquiry, icon: "question", color: "#FF6900" },
};

const FALLBACK_CATEGORY = SEEDED_CATEGORIES.general_inquiry;

const isSeededSlug = (slug: string): slug is TicketCategory =>
  Object.prototype.hasOwnProperty.call(SEEDED_CATEGORIES, slug);

export type ResolvedCategory = Pick<CategoryRef, "slug" | "name" | "icon" | "color"> & {
  id?: number;
};

/**
 * What to draw for a ticket's category: `category_ref` when the API sent
 * one, else the seed table by slug, else a generic "?" tile that still shows
 * the slug as its name (a category deleted server-side never blanks a row).
 */
export const resolveCategory = (ticket: {
  category?: string | null;
  category_ref?: CategoryRef | null;
}): ResolvedCategory => {
  if (ticket.category_ref) return ticket.category_ref;
  const slug = ticket.category ?? "";
  if (isSeededSlug(slug)) return SEEDED_CATEGORIES[slug];
  if (slug) {
    return { ...FALLBACK_CATEGORY, slug, name: CATEGORY_LABELS[slug] ?? slug };
  }
  return FALLBACK_CATEGORY;
};

/** `#0788F3` + 0.1 → `rgba(7, 136, 243, 0.1)`; a malformed value falls back to the primary. */
export const hexToRgba = (hex: string, alpha: number): string => {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const value = match ? match[1] : "0788f3";
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/* ───────────────────────────── message tones ───────────────────────────── */

export type SupportTone = "error" | "info" | "success" | "waiting" | "neutral";

/**
 * Border + tint + text of the support message boxes and info pills (Tailwind v4 palette, as
 * drawn: red / blue / green / violet / grey 200 border, 50 fill, 700–800 text; dark = the hue at
 * 40 % / 15 %). One source for `SupportAlert`, `CountPill` and the state banner.
 */
export const SUPPORT_TONE_CLASS: Record<SupportTone, string> = {
  error: "border-[#ffc9c9] bg-[#fef2f2] text-[#9f0712] dark:border-[#fb2c36]/40 dark:bg-[#fb2c36]/15 dark:text-[#ffa2a2]",
  info: "border-[#bedbff] bg-[#eff6ff] text-[#1447e6] dark:border-[#2b7fff]/40 dark:bg-[#2b7fff]/15 dark:text-support-primary-text-dark",
  success: "border-[#b6e2bf] bg-[#eef8f0] text-[#008236] dark:border-[#00c950]/40 dark:bg-[#00c950]/10 dark:text-[#7bf1a8]",
  waiting: "border-[#ddd6ff] bg-[#f5f3ff] text-[#7008e7] dark:border-[#8e51ff]/45 dark:bg-[#8e51ff]/15 dark:text-[#c4b4ff]",
  neutral: "border-[#e5e7eb] bg-[#f3f4f6] text-[#364153] dark:border-white/15 dark:bg-white/5 dark:text-[#d1d5dc]",
};
