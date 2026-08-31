"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useLogInUserStore } from "@/store/logInUserStore";
import { TOUR_ANCHORS } from "@/lib/onboarding/anchors";
import { visibleTasksForRole } from "@/lib/onboarding/registry";
import { CreateActionKind, createActionsForRole } from "@/lib/quickActions";
import { MANAGEMENT_ROLES, hasRole } from "@/lib/roles";
import { useQuickActionStore } from "@/store/quickActionStore";
import {
  employeeOthersSidebarItems,
  othersSidebarItems,
  sidebarItems,
  sidebarItemsEmployee,
} from "@/utils/SidebarItems";

/**
 * Global search / quick actions (⌘K, Ctrl+K).
 *
 * Built here because the orientation tour's first stop points at it and there
 * was nothing to point at: `cmdk` was already a dependency and shadcn's
 * `CommandDialog` was already in `components/ui`, but nothing in the app ever
 * imported it and no global shortcut existed.
 *
 * Destinations come from `SidebarItems.ts` rather than a second hand-written
 * list, so a nav item added there is searchable here for free — and cannot
 * drift out of sync with what the sidebar actually shows a given role.
 */

interface CommandEntry {
  label: string;
  href: string;
  /** Parent group, shown as a subtitle so two "Settings" rows are tellable apart. */
  group?: string;
}

interface QuickAction {
  key: string;
  label: string;
  /** Subtitle, shown right-aligned — the row's context in one word or phrase. */
  hint: string;
  href: string;
  /**
   * Create dialog to open on arrival. Without it the row is a bare
   * navigation and the user has to press the page's own "Add ..." button —
   * the click they just made.
   */
  intent?: CreateActionKind;
}

export default function CommandBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const logInUserData = useLogInUserStore((state) => state.logInUserData);
  const role = logInUserData?.role as string | undefined;

  const isManagement = hasRole(MANAGEMENT_ROLES, role);

  const requestCreate = useQuickActionStore((state) => state.requestCreate);

  const destinations = useMemo<CommandEntry[]>(() => {
    const main = isManagement ? sidebarItems : sidebarItemsEmployee;
    const others = isManagement ? othersSidebarItems : employeeOthersSidebarItems;

    return [...main, ...others].flatMap<CommandEntry>((item) =>
      item.subItems.length > 0
        ? // A collapsible parent's own `key` is a group slug, not a route
          // ("project-management", "Activity") — only its children navigate.
          item.subItems.map((sub) => ({
            label: sub.label,
            href: sub.key,
            group: item.label,
          }))
        : [{ label: item.label, href: item.key }],
    );
  }, [isManagement]);

  /**
   * The getting-started checklist's actions first — those are the ones a new
   * workspace is actively being nagged about — then any remaining create
   * action the checklist has no row for (creating a task is everyday work, not
   * a setup milestone). Both halves are role-filtered by their own source, so
   * nobody is offered a dialog they cannot open.
   */
  const quickActions = useMemo<QuickAction[]>(() => {
    const fromChecklist: QuickAction[] = visibleTasksForRole(role)
      .filter((task) => task.id !== "TOUR_COMPLETED")
      .map((task) => ({
        key: task.id,
        label: task.ctaLabel,
        hint: task.label,
        href: task.href,
        intent: task.createIntent,
      }));

    const covered = new Set(fromChecklist.map((action) => action.intent));

    const rest: QuickAction[] = createActionsForRole(role)
      .filter((action) => !covered.has(action.kind))
      .map((action) => ({
        key: action.kind,
        label: action.label,
        hint: action.hint,
        href: action.href,
        intent: action.kind,
      }));

    return [...fromChecklist, ...rest];
  }, [role]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k") return;
      if (!event.metaKey && !event.ctrlKey) return;

      event.preventDefault();
      setOpen((previous) => !previous);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      // Deliberately NOT touching the sidebar store here: `setOpenMenu`
      // TOGGLES (`sidebarStore.ts`), so nudging it can close the group the
      // user is navigating into. `SidebarRouteSync` syncs the rail from the
      // pathname anyway.
      router.push(href);
    },
    [router],
  );

  /**
   * "Add client" has to add a client, not show the page that has an Add Client
   * button on it. The intent is raised before the navigation so it is already
   * in the store when the destination's hero section mounts and claims it.
   */
  const run = useCallback(
    (action: QuickAction) => {
      if (action.intent) requestCreate(action.intent);
      go(action.href);
    },
    [go, requestCreate],
  );

  return (
    <>
      <button
        type="button"
        data-tour={TOUR_ANCHORS.globalSearch}
        onClick={() => setOpen(true)}
        aria-label="Search and quick actions"
        className="flex h-10 items-center gap-2 rounded-[8px] border border-borderColor px-3 text-sm text-subTextColor transition-colors hover:text-headingTextColor dark:border-darkBorder dark:text-darkTextSecondary dark:hover:text-darkTextPrimary cursor-pointer"
      >
        <Search className="size-4" />
        <span className="hidden xl:inline">Search…</span>
        <kbd className="hidden xl:inline rounded border border-borderColor px-1.5 py-0.5 text-[10px] font-medium dark:border-darkBorder">
          ⌘K
        </kbd>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search and quick actions"
        description="Jump to any page or start a setup task"
      >
        <CommandInput placeholder="Search pages and actions…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {quickActions.length > 0 && (
            <>
              <CommandGroup heading="Quick actions">
                {quickActions.map((action) => (
                  <CommandItem
                    key={action.key}
                    // cmdk matches on `value`, so folding the hint in makes
                    // "add member" find "Add a team member".
                    value={`${action.label} ${action.hint}`}
                    onSelect={() => run(action)}
                  >
                    {action.label}
                    <CommandShortcut>{action.hint}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          <CommandGroup heading="Go to">
            {destinations.map((entry) => (
              <CommandItem
                key={entry.href}
                value={`${entry.group ? `${entry.group} ` : ""}${entry.label} ${entry.href}`}
                onSelect={() => go(entry.href)}
              >
                {entry.label}
                {entry.group && <CommandShortcut>{entry.group}</CommandShortcut>}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
