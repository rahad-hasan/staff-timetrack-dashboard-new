/**
 * Every spotlight anchor in the app, and the file that carries it.
 *
 * The tour finds targets with `document.querySelector('[data-tour="..."]')`
 * at step entry — never by class name, never by a ref collected at mount.
 * Refs would miss re-renders (`SideBar` is `React.memo`, `Header` and
 * `ProfileDropDown` are separate client trees) and class names change with
 * every restyle.
 *
 * Adding an anchor means: add a constant here, put the attribute on exactly
 * ONE element, and reference the constant from `registry.ts`. Two elements
 * sharing an anchor is a bug — `querySelector` takes the first in document
 * order, which is the mobile copy for anything the Header renders twice.
 */
export const TOUR_ANCHORS = {
  /** Sidebar rail as a whole — `src/components/layout/SideBar.tsx`. */
  sidebarNav: "sidebar-nav",
  /** Header ⌘K trigger — `src/components/Onboarding/CommandBarTrigger.tsx`. */
  globalSearch: "global-search",
  /** Today's tracked time — `src/components/layout/Header.tsx`. */
  headerTimer: "header-timer",
  /** Light/dark switch — `src/components/layout/Header/DarkMoodToogle.tsx`. */
  themeToggle: "theme-toggle",
  /** Profile popover trigger — `src/components/layout/Header/ProfileDropDown.tsx`. */
  profileMenu: "profile-menu",
  /** Metric card grid — `src/app/(main_layout)/dashboard/@topCart/page.tsx`. */
  dashboardStats: "dashboard-stats",
  /** Add Client — `src/components/ProjectManagement/Clients/ClientHereSection.tsx`. */
  ctaAddClient: "cta-add-client",
  /** Add Project — `src/components/ProjectManagement/Projects/ProjectHeroSection.tsx`. */
  ctaAddProject: "cta-add-project",
  /** Add Member — `src/components/Members/MemberHeroSection.tsx`. */
  ctaAddMember: "cta-add-member",
} as const;

export type TourAnchor = (typeof TOUR_ANCHORS)[keyof typeof TOUR_ANCHORS];

export const anchorSelector = (anchor: string): string =>
  `[data-tour="${anchor}"]`;

/**
 * Resolve an anchor to a *usable* element.
 *
 * "Usable" is doing real work here. The desktop sidebar lives inside
 * `hidden lg:block` (`(main_layout)/layout.tsx`), so below the `lg` breakpoint
 * its anchors are still in the DOM and still match the selector — they just
 * measure 0×0. Spotlighting one would punch a hole of nothing in the middle of
 * the screen and park a tooltip in the corner. A zero-area rect is treated as
 * "not present", which lets the tour skip the step instead.
 */
export const resolveAnchor = (anchor: string): HTMLElement | null => {
  if (typeof document === "undefined") return null;

  const nodes = document.querySelectorAll<HTMLElement>(anchorSelector(anchor));

  for (const node of nodes) {
    const rect = node.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) return node;
  }

  return null;
};
