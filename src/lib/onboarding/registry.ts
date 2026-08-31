import {
  IOnboardingTask,
  ITourStep,
  OnboardingTaskId,
  TourId,
} from "@/types/onboarding";

/**
 * The whole tour, declared in one place.
 *
 * Nothing here reaches into the DOM by class name or nth-child. Every step
 * names a `data-tour` value, and the element carrying that value is the
 * contract — so a card can be restyled or moved without silently breaking the
 * walkthrough. `src/lib/onboarding/anchors.ts` lists every anchor and where it
 * is attached.
 *
 * CONSECUTIVE steps must never share a `target`. The target tracker resets on
 * anchor *change* (`useTourTarget`'s effect keys on the anchor string), so a
 * repeated anchor would never re-enter its search phase — and the gate's
 * missing-verdict guard, which compares the verdict's anchor against the
 * current step's, would wave the stale verdict through and skip the second
 * step unsearched.
 */

/* ------------------------------------------------------------------ *
 * Roles
 * ------------------------------------------------------------------ */

/**
 * Mirrors the role gates already duplicated across the app — `SideBar.tsx`
 * (which arrays to render), `ProjectHeroSection.tsx` (Add Project), and
 * `dashboard/layout.tsx` (the members row). A step or task whose target only
 * exists for some roles must carry the same gate, or the tour dead-ends on a
 * target that will never mount.
 */
export const MANAGEMENT_ROLES = ["admin", "manager", "hr"] as const;
export const PROJECT_ROLES = ["admin", "manager"] as const;
export const ALL_ROLES = [
  "admin",
  "manager",
  "hr",
  "project_manager",
  "employee",
] as const;

/* ------------------------------------------------------------------ *
 * Getting-started checklist
 * ------------------------------------------------------------------ */

export const ONBOARDING_TASK_LIST: readonly IOnboardingTask[] = [
  {
    id: "CLIENT_CREATED",
    label: "Add your first client",
    description: "Clients are who your projects and billable hours roll up to.",
    href: "/project-management/clients",
    ctaLabel: "Add client",
    roles: MANAGEMENT_ROLES,
  },
  {
    id: "PROJECT_CREATED",
    label: "Create your first project",
    description: "Projects are what your team tracks time against.",
    href: "/project-management/projects",
    ctaLabel: "Create project",
    roles: PROJECT_ROLES,
  },
  {
    id: "TEAM_INVITED",
    label: "Invite a team member",
    description: "Add teammates and give them a role and permissions.",
    href: "/members",
    ctaLabel: "Invite team",
    roles: MANAGEMENT_ROLES,
  },
  {
    id: "DESKTOP_APP_DOWNLOADED",
    label: "Get the desktop tracker",
    description: "Time, apps and screenshots are captured by the desktop app.",
    href: "/download",
    ctaLabel: "Download",
    roles: ALL_ROLES,
  },
  {
    id: "TOUR_COMPLETED",
    label: "Finish the product tour",
    description: "A two-minute pass over everything in your workspace.",
    href: "/dashboard",
    ctaLabel: "Start tour",
    roles: ALL_ROLES,
  },
] as const;

/**
 * An employee can neither add clients nor invite teammates, so showing them a
 * "1/5 complete" checklist they can never finish would be worse than showing
 * none at all. The denominator is per-role.
 */
export const visibleTasksForRole = (
  role: string | undefined,
): IOnboardingTask[] =>
  ONBOARDING_TASK_LIST.filter((task) =>
    role ? task.roles.includes(role) : false,
  );

/* ------------------------------------------------------------------ *
 * Phase 2 — core workflow walkthrough
 * ------------------------------------------------------------------ */

const CORE_STEPS: readonly ITourStep[] = [
  {
    id: "core.clients",
    tour: "core",
    target: "cta-add-client",
    route: "/project-management/clients",
    title: "Start with a client",
    body: "Create your first client profile to organise the projects, hours and billing that belong to them. Everything else in the workspace hangs off this.",
    placement: "bottom-end",
    task: "CLIENT_CREATED",
    roles: MANAGEMENT_ROLES,
  },
  {
    id: "core.projects",
    tour: "core",
    target: "cta-add-project",
    route: "/project-management/projects",
    title: "Add a project",
    body: "Projects sit under a client and are what your team tracks time against. Create one now — the workspace overview updates the moment you save.",
    placement: "bottom-end",
    task: "PROJECT_CREATED",
    roles: PROJECT_ROLES,
  },
  {
    id: "core.team",
    tour: "core",
    target: "cta-add-member",
    route: "/members",
    title: "Bring your team in",
    body: "Invite teammates and assign each one a role. Roles decide what they can see and change — an employee tracks time, a manager runs projects.",
    placement: "bottom-end",
    task: "TEAM_INVITED",
    roles: MANAGEMENT_ROLES,
  },
] as const;

/* ------------------------------------------------------------------ *
 * Phase 4 — A-to-Z dashboard orientation
 * ------------------------------------------------------------------ */

const ORIENTATION_STEPS: readonly ITourStep[] = [
  {
    id: "orientation.command-bar",
    tour: "orientation",
    target: "global-search",
    route: "/dashboard",
    title: "Jump anywhere instantly",
    body: "Search every page and run quick actions from one bar. Press ⌘K (Ctrl + K on Windows) from anywhere — you never have to hunt through the menu.",
    placement: "bottom-start",
    roles: ALL_ROLES,
  },
  {
    id: "orientation.metrics",
    tour: "orientation",
    target: "dashboard-stats",
    route: "/dashboard",
    title: "Your numbers at a glance",
    body: "Activity, tracked work, active projects and members — each card compares against the previous period. Switch between daily, weekly and monthly above.",
    placement: "bottom",
    padding: 10,
    roles: ALL_ROLES,
  },
  {
    id: "orientation.sidebar",
    tour: "orientation",
    target: "sidebar-nav",
    route: "/dashboard",
    title: "Everything lives here",
    body: "Timesheets, activity and screenshots, insights, projects and reports. Collapse the rail with the icon at the top when you want more room.",
    placement: "right",
    padding: 6,
    roles: ALL_ROLES,
  },
  {
    id: "orientation.timer",
    tour: "orientation",
    target: "header-timer",
    route: "/dashboard",
    title: "Today's tracked time",
    body: "A live total for today, synced from the desktop tracker. If this stays at zero, the desktop app is not running or not signed in.",
    placement: "bottom-start",
    roles: ALL_ROLES,
  },
  {
    id: "orientation.appearance",
    tour: "orientation",
    target: "theme-toggle",
    route: "/dashboard",
    title: "Make it yours",
    body: "Switch between light and dark, and pick the accent colour used across charts, buttons and highlights. Try it — the preview below is live.",
    placement: "bottom-end",
    preview: "brand-color",
    roles: ALL_ROLES,
  },
  {
    id: "orientation.profile",
    tour: "orientation",
    target: "profile-menu",
    route: "/dashboard",
    title: "Account, plan and settings",
    body: "Your profile, workspace settings and subscription all live behind this menu — along with Restart product tour, if you ever want this walkthrough again.",
    placement: "bottom-end",
    roles: ALL_ROLES,
  },
  /**
   * The finale, and the only step that leaves the dashboard. The tour ends on
   * the download page on purpose: nothing in this product works until the
   * desktop app is installed, so the walkthrough's last act is to put the
   * installer in front of the user and get out of the way. Finishing here
   * earns TOUR_COMPLETED (awarded by `endTour`, not by this step's `task` —
   * see `onboardingStore.ts`); the download tick is earned by heading for the
   * installer (the Header's Download App link) or clicking one
   * (`Download/DownloadButton.tsx`) — never by pressing Finish.
   */
  {
    id: "orientation.download",
    tour: "orientation",
    target: "download-app",
    route: "/download",
    title: "One last thing — get the desktop tracker",
    body: "Time, apps and screenshots are all captured by the desktop app; the dashboard only reports what it records. Grab the build for your machine — every installer comes straight from our official release — then press Finish. You're all set.",
    placement: "bottom",
    padding: 10,
    radius: 12,
    // The anchor only mounts once `useReleases` settles, and that fetch gets
    // 10s before the pinned fallback renders. The default 6s patience would
    // lose that race on a slow connection and kill the tour on its last step.
    targetTimeoutMs: 15_000,
    task: "DESKTOP_APP_DOWNLOADED",
    roles: ALL_ROLES,
  },
] as const;

/* ------------------------------------------------------------------ *
 * Lookup
 * ------------------------------------------------------------------ */

const TOURS: Record<TourId, readonly ITourStep[]> = {
  core: CORE_STEPS,
  orientation: ORIENTATION_STEPS,
};

export const stepsForTour = (
  tour: TourId,
  role: string | undefined,
): ITourStep[] =>
  TOURS[tour].filter((step) => !step.roles || (role && step.roles.includes(role)));

/**
 * `currentStepIndex` is persisted as a single number across both tours, so the
 * two step lists share one address space: core occupies 0..n-1 and orientation
 * continues from there. Resuming therefore restores the tour as well as the
 * position, from one integer column.
 */
export const CORE_STEP_COUNT = CORE_STEPS.length;

export const tourForGlobalIndex = (index: number): TourId =>
  index < CORE_STEP_COUNT ? "core" : "orientation";

export const toGlobalIndex = (tour: TourId, localIndex: number): number =>
  tour === "core" ? localIndex : CORE_STEP_COUNT + localIndex;

export const toLocalIndex = (tour: TourId, globalIndex: number): number =>
  tour === "core" ? globalIndex : globalIndex - CORE_STEP_COUNT;

/** Tasks a role can see, and how many of them are already done. */
export const checklistProgress = (
  role: string | undefined,
  completed: OnboardingTaskId[],
): { total: number; done: number; tasks: IOnboardingTask[] } => {
  const tasks = visibleTasksForRole(role);
  return {
    tasks,
    total: tasks.length,
    done: tasks.filter((task) => completed.includes(task.id)).length,
  };
};
