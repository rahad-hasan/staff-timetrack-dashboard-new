/**
 * Role gates, in one place.
 *
 * These mirror the gates already duplicated across the app — `SideBar.tsx`
 * (which arrays to render), `ProjectHeroSection.tsx` (Add Project),
 * `TaskHeroSection.tsx` (Create Task) and `dashboard/layout.tsx` (the members
 * row). A tour step, checklist task or quick action whose trigger only exists
 * for some roles must carry the same gate, or it dead-ends on a button that
 * will never render.
 *
 * They live here rather than in `lib/onboarding/registry.ts` so that
 * `lib/quickActions.ts` — which the registry itself imports — can reach them
 * without an import cycle. The layering is one-directional:
 *
 *   roles.ts → quickActions.ts → types/onboarding.ts → onboarding/registry.ts
 */

export const MANAGEMENT_ROLES = ["admin", "manager", "hr"] as const;

export const PROJECT_ROLES = ["admin", "manager"] as const;

/** Who may create a task — matches `TaskHeroSection`'s own gate. */
export const TASK_ROLES = [
  "admin",
  "manager",
  "hr",
  "project_manager",
] as const;

export const ALL_ROLES = [
  "admin",
  "manager",
  "hr",
  "project_manager",
  "employee",
] as const;

/** Undefined role never passes — a missing role is not a permissive one. */
export const hasRole = (
  allowed: readonly string[],
  role: string | undefined,
): boolean => Boolean(role && allowed.includes(role));
