/**
 * Date/number formatting for the support screens (blueprint Appendix B
 * §1.6). The API returns ISO-8601 UTC strings; every label here is computed
 * on the client, in the viewer's local time zone.
 */

import {
  differenceInCalendarDays,
  differenceInSeconds,
  format,
  isValid,
  parseISO,
} from "date-fns";

export type DateInput = string | number | Date | null | undefined;

export const toDate = (value: DateInput): Date | null => {
  if (value === null || value === undefined || value === "") return null;
  const date = typeof value === "string" ? parseISO(value) : new Date(value);
  return isValid(date) ? date : null;
};

const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? "" : "s"}`;

export type RelativeTimeStyle = "long" | "short";

/**
 * The user-portal relative vocabulary as drawn (REQ-U-20, UP-Default /
 * UP-Page2): "just now", "N minutes ago", "N hours ago", "yesterday",
 * "N days ago", "N weeks ago", "about N months ago", "about N years ago" —
 * lowercase, full words. `style: "short"` gives the §4.4 compact form for
 * tight places (ticket-page timeline): "just now", "12 min ago",
 * "2 hrs ago", "yesterday", "3 days ago", "2 wks ago", "Sep 2" (≥ 30 days).
 * Future timestamps (clock skew) read as "just now".
 */
export const formatRelativeTime = (
  value: DateInput,
  now: Date = new Date(),
  style: RelativeTimeStyle = "long",
): string => {
  const date = toDate(value);
  if (!date) return "";
  const seconds = Math.max(0, differenceInSeconds(now, date));
  if (seconds < 45) return "just now";
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) {
    return style === "short" ? `${minutes} min ago` : `${plural(minutes, "minute")} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    if (style === "short") return `${hours} ${hours === 1 ? "hr" : "hrs"} ago`;
    return `${plural(hours, "hour")} ago`;
  }
  const days = Math.max(1, differenceInCalendarDays(now, date));
  if (days === 1) return "yesterday";
  if (days < 7) return `${plural(days, "day")} ago`;
  if (days < 30) {
    const weeks = Math.max(1, Math.round(days / 7));
    return style === "short" ? `${weeks} ${weeks === 1 ? "wk" : "wks"} ago` : `${plural(weeks, "week")} ago`;
  }
  if (style === "short") return format(date, "MMM d");
  if (days < 365) return `about ${plural(Math.max(1, Math.round(days / 30)), "month")} ago`;
  return `about ${plural(Math.max(1, Math.round(days / 365)), "year")} ago`;
};

/** "Sep 2, 2026 at 10:12 AM" (detail header "Opened …", tooltips). */
export const formatAbsolute = (value: DateInput): string => {
  const date = toDate(value);
  return date ? format(date, "MMM d, yyyy 'at' h:mm a") : "";
};

/** "10:12 AM" — message and event times. */
export const formatClock = (value: DateInput): string => {
  const date = toDate(value);
  return date ? format(date, "h:mm a") : "";
};

/** "Today" | "Yesterday" | "Sep 2, 2026" — timeline date separators. */
export const formatDaySeparator = (value: DateInput, now: Date = new Date()): string => {
  const date = toDate(value);
  if (!date) return "";
  const days = differenceInCalendarDays(now, date);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return format(date, "MMM d, yyyy");
};

/** "Today, 2:14 PM" or "Sep 2, 2:14 PM" — attachment / rating cards. */
export const formatDayAndClock = (value: DateInput, now: Date = new Date()): string => {
  const date = toDate(value);
  if (!date) return "";
  const days = differenceInCalendarDays(now, date);
  const day = days === 0 ? "Today" : days === 1 ? "Yesterday" : format(date, "MMM d");
  return `${day}, ${format(date, "h:mm a")}`;
};

/** The footer "Showing 1–5 of 7 tickets" pieces (en dash, REQ-U-06). */
export const pageRange = (page: number, limit: number, total: number) => {
  if (total <= 0) return { from: 0, to: 0, total: 0, label: "0" };
  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  return { from, to, total, label: `${from}–${to}` };
};

/** "tickets" / "ticket" for the footer and chips row. */
export const ticketsWord = (count: number) => (count === 1 ? "ticket" : "tickets");
