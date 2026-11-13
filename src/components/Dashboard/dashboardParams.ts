/**
 * The dashboard's URL state, parsed in one place.
 *
 * `?tab=` picks the stats window and `?type=` the core-members ranking. Both
 * come straight from the address bar and the API validates them strictly —
 * `/dashboard/stats` and `/admin/core-member` answer 400 for anything else — so
 * a hand-edited or stale link used to take a panel down (the hero throws into
 * the error boundary, Insights printed "undefined%"). Every reader parses
 * through these, which also keeps the panels, the heading and the API calls
 * agreeing on which window is on screen.
 *
 * Plain module, no directive: used by server slots and client components alike.
 */

export const DASHBOARD_TABS = ["daily", "weekly", "monthly"] as const;
export type DashboardTab = (typeof DASHBOARD_TABS)[number];

/** `?tab=` → a window the API accepts; anything else is the default view. */
export const parseDashboardTab = (value: unknown): DashboardTab =>
  DASHBOARD_TABS.find((tab) => tab === value) ?? "daily";

export const CORE_MEMBER_SORTS = ["highest", "lowest"] as const;
export type CoreMemberSort = (typeof CORE_MEMBER_SORTS)[number];

/** `?type=` → the core-members ranking; anything else is "Top Activity". */
export const parseCoreMemberSort = (value: unknown): CoreMemberSort =>
  CORE_MEMBER_SORTS.find((sort) => sort === value) ?? "highest";
