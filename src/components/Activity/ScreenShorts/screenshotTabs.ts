/*
 * The two views of the screenshots page, chosen by `?tab`. Shared by the
 * toggle, the server component that picks the loading skeleton, and the
 * client component that shows the view: both views are drawn from one read of
 * the day (see ScreenshotsDay), so the tab is not part of what is fetched.
 */

export const EVERY_10_MIN_TAB = "Every 10 min";
export const ALL_SCREENSHOTS_TAB = "All Screenshots";

export const SCREENSHOT_TABS = [EVERY_10_MIN_TAB, ALL_SCREENSHOTS_TAB] as const;

export type ScreenshotTab = (typeof SCREENSHOT_TABS)[number];

/** The view a `?tab` value names. Anything else is the default view. */
export const resolveScreenshotTab = (value: unknown): ScreenshotTab =>
  value === ALL_SCREENSHOTS_TAB ? ALL_SCREENSHOTS_TAB : EVERY_10_MIN_TAB;

/**
 * Identifies the data a query shows: every filter except the tab. It keys the
 * Suspense boundaries of the page, so a new day or member shows the skeleton
 * while a tab change (which fetches nothing) never does.
 */
export const screenshotDayKey = (params: Record<string, unknown>): string =>
  JSON.stringify(Object.entries(params).filter(([name]) => name !== "tab"));
