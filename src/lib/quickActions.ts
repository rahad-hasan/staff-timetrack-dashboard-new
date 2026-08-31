import {
  MANAGEMENT_ROLES,
  PROJECT_ROLES,
  TASK_ROLES,
  hasRole,
} from "@/lib/roles";

/**
 * Every "create a thing" entry point in the app, declared once.
 *
 * The problem this solves: a create dialog lives *inside* the page that lists
 * what it creates (`ClientHereSection`, `ProjectHeroSection`, `TaskHeroSection`,
 * `MemberHeroSection` each own a `useState` and a `<Dialog>`). Anything that
 * offers "Add client" from somewhere else — the Quick Setup guide, the
 * getting-started widget, the ⌘K palette, the profile menu — can only navigate
 * to that page, which leaves the user staring at an empty table and hunting for
 * the button they just pressed. Every one of those surfaces has to re-implement
 * the same two facts: where the dialog lives, and who is allowed to open it.
 *
 * So both facts live here, and `quickActionStore`'s intent carries the click
 * across the navigation. Adding a fifth create surface means one entry in this
 * table plus one `useCreateIntent` call in the component that owns the dialog —
 * every caller picks it up for free.
 */

export const CREATE_ACTION_KINDS = [
  "client",
  "project",
  "task",
  "member",
] as const;

export type CreateActionKind = (typeof CREATE_ACTION_KINDS)[number];

export interface ICreateAction {
  kind: CreateActionKind;
  /** The page that owns the dialog — where the intent must be carried to. */
  href: string;
  /** Imperative label, as it reads on a button or a command-palette row. */
  label: string;
  /** Section the action belongs to, shown as a palette subtitle. */
  hint: string;
  /**
   * Roles whose UI actually renders the trigger. Offering the action to
   * anyone else navigates them to a page with no button and no dialog — the
   * intent then expires unclaimed, which is a silent no-op.
   */
  roles: readonly string[];
}

export const CREATE_ACTIONS: Record<CreateActionKind, ICreateAction> = {
  client: {
    kind: "client",
    href: "/project-management/clients",
    label: "Add client",
    hint: "Clients",
    roles: MANAGEMENT_ROLES,
  },
  project: {
    kind: "project",
    href: "/project-management/projects",
    label: "Create project",
    hint: "Projects",
    roles: PROJECT_ROLES,
  },
  task: {
    kind: "task",
    href: "/project-management/task",
    label: "Create task",
    hint: "Tasks",
    roles: TASK_ROLES,
  },
  member: {
    kind: "member",
    href: "/members",
    label: "Add member",
    hint: "Members",
    roles: MANAGEMENT_ROLES,
  },
};

/** In declaration order, filtered to what this role can actually do. */
export const createActionsForRole = (
  role: string | undefined,
): ICreateAction[] =>
  CREATE_ACTION_KINDS.map((kind) => CREATE_ACTIONS[kind]).filter((action) =>
    hasRole(action.roles, role),
  );
