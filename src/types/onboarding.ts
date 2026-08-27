import type { Placement } from "@floating-ui/react";

/**
 * Onboarding / product-tour contract.
 *
 * Two things live behind one name and must not be confused:
 *
 *  - **Checklist tasks** (`OnboardingTaskId`) are *workspace milestones*. They
 *    are earned by really doing the thing (creating a client, inviting a
 *    member) and are persisted server-side in `completedSteps`. They survive
 *    logout, device changes and the tour being skipped.
 *  - **Tour steps** (`TourStepId`) are *positions in a guided walkthrough*.
 *    They are pure UI choreography; only the index of the furthest reached
 *    step is persisted (`currentStepIndex`) so a refresh can resume.
 *
 * Keeping them separate is what lets a user skip the tour entirely and still
 * get a truthful "3/5 done" checklist, and lets a user who set the workspace
 * up before ever seeing the tour start it already 3/5 complete.
 */

/* ------------------------------------------------------------------ *
 * Checklist tasks — persisted workspace milestones
 * ------------------------------------------------------------------ */

export const ONBOARDING_TASKS = [
  "CLIENT_CREATED",
  "PROJECT_CREATED",
  "TEAM_INVITED",
  "DESKTOP_APP_DOWNLOADED",
  "TOUR_COMPLETED",
] as const;

export type OnboardingTaskId = (typeof ONBOARDING_TASKS)[number];

/** Runtime guard — the server may hold task ids a newer client no longer ships. */
export const isOnboardingTask = (value: string): value is OnboardingTaskId =>
  (ONBOARDING_TASKS as readonly string[]).includes(value);

export interface IOnboardingTask {
  id: OnboardingTaskId;
  label: string;
  description: string;
  /** Where the quick-action button sends the user. */
  href: string;
  ctaLabel: string;
  /**
   * Roles that can actually perform the task. An employee cannot invite
   * teammates, so the checklist must not show them a task they can never
   * finish — see `visibleTasksForRole`.
   */
  roles: readonly string[];
}

/* ------------------------------------------------------------------ *
 * Server state — GET / PATCH /api/v1/user/onboarding-status
 * ------------------------------------------------------------------ */

export interface IOnboardingStatus {
  isOnboardingCompleted: boolean;
  currentStepIndex: number;
  completedSteps: OnboardingTaskId[];
  isDismissed: boolean;
  /**
   * Server-computed, and it has to be: the frontend has no `created_at` for
   * the logged-in user at all. `buildLogInUserData` in `src/lib/authSession.ts`
   * projects the sign-in response down to nine keys and drops it, and
   * `getDecodedUser()` only ever returns `{ id, email, role, iat, exp }`.
   * Deriving the window from the browser clock would also be wrong — a machine
   * set a month fast would silently suppress the welcome modal.
   */
  isNewUser: boolean;
  /** ISO-8601. Exposed for display ("joined 2 days ago"), not for gating. */
  userCreatedAt: string | null;
}

/** PATCH body — every field optional; only what is sent is written. */
export interface IOnboardingStatusUpdate {
  isOnboardingCompleted?: boolean;
  currentStepIndex?: number;
  isDismissed?: boolean;
  /**
   * Tasks to ADD. The server unions these into `completedSteps` — it never
   * replaces the array. Two tabs finishing different tasks concurrently must
   * not clobber each other, and a milestone once earned is never un-earned.
   */
  completeSteps?: OnboardingTaskId[];
  /** Full reset — used by "Restart tour" in the profile menu. */
  reset?: boolean;
}

/* ------------------------------------------------------------------ *
 * Tour choreography
 * ------------------------------------------------------------------ */

/** Which walkthrough a step belongs to. */
export type TourId = "core" | "orientation";

export type TourStepId =
  // Phase 2 — core workflow
  | "core.clients"
  | "core.projects"
  | "core.team"
  // Phase 4 — A-to-Z dashboard orientation
  | "orientation.command-bar"
  | "orientation.metrics"
  | "orientation.sidebar"
  | "orientation.timer"
  | "orientation.appearance"
  | "orientation.profile";

export interface ITourStep {
  id: TourStepId;
  tour: TourId;
  /**
   * `data-tour` value of the element to spotlight. Resolved lazily at step
   * entry — the element does not need to exist when the tour starts.
   */
  target: string;
  title: string;
  body: string;
  /** Preferred side; floating-ui flips/shifts it if it will not fit. */
  placement?: Placement;
  /** Extra px of breathing room around the measured target rect. */
  padding?: number;
  /** Corner radius of the spotlight hole; defaults to the element's own. */
  radius?: number;
  /**
   * Route this step's target lives on. When set and the user is elsewhere the
   * tour navigates there first, then waits for the target to mount.
   */
  route?: string;
  /**
   * Nav groups are collapsed by default, so a step targeting a sub-item has to
   * open its parent first. The value is the parent's `key` in
   * `src/utils/SidebarItems.ts`.
   */
  expandsNavMenu?: string;
  /**
   * When set the step shows a live, interactive preview panel inside the
   * tooltip instead of plain copy — the "change a control, watch it apply"
   * behaviour from the reference design.
   */
  preview?: "brand-color";
  /**
   * Milestone this step is teaching. Used to render an inline "done" tick in
   * the tooltip the instant the user actually completes the action, without a
   * reload.
   */
  task?: OnboardingTaskId;
  /**
   * Roles allowed to see the step. Steps whose targets only render for admins
   * are filtered out for everyone else rather than dead-ending the tour.
   */
  roles?: readonly string[];
}

/** Measured, viewport-relative box of a spotlit element. */
export interface ITargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
}
