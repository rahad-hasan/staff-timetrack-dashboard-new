# Onboarding & product tour (Implementation Spec)

> **Audience:** frontend/backend engineers working on this repo.
> **Status:** fully implemented on both sides. Migration `20260827090000_user_onboarding_state` is applied. Every path in this doc was written against the shipped code.
> **Canonical:** this file. Anything else describing the tour is a snapshot.

---

## 1. The one idea that shapes everything

Two things wear the word "step" and confusing them is the main way to break this feature.

| | **Checklist tasks** (`OnboardingTaskId`) | **Tour steps** (`TourStepId`) |
| --- | --- | --- |
| What | Workspace milestones | Positions in a walkthrough |
| Earned by | Really doing it (creating a client) | Clicking "Next" |
| Persisted as | `completedSteps: string[]` (append-only) | `currentStepIndex: number` |
| Survives | Logout, device change, skipping the tour | Nothing — runtime only |
| Truthful when the tour is skipped | **Yes** | n/a |

That split is what lets a user ignore the tour entirely, set the workspace up by hand, and still see an accurate "3/5 done" — and lets someone who set things up last week start the tour already 3/5 complete.

Types: `src/types/onboarding.ts`.

---

## 2. Backend

### 2.1 Schema

Four plain columns on `User` (`prisma/schema.prisma`, in the boolean cluster before `updated_at`):

```prisma
is_onboarding_completed    Boolean  @default(false)
is_onboarding_dismissed    Boolean  @default(false)
onboarding_step_index      Int      @default(0)
onboarding_completed_steps String[] @default([])
```

Columns on `User` rather than a side table because `auth()` already loads the whole row on every request — reading tour state costs zero extra queries.

**API names are camelCase, columns are snake_case.** The service is the only translation point (`serialize`). Do not leak column names to the client.

The migration backfills `is_onboarding_completed = true` for every user created before `2026-08-27`. Existing accounts must not be ambushed by a "Welcome, let's build your workspace" modal.

### 2.2 Module

`src/app/modules/Onboarding/` — standard 5-file shape, mounted at **`/user`** in `routes/index.ts` (not `/auth`, so the URLs read `/api/v1/user/onboarding-status`).

| Method | Path | Middleware |
| --- | --- | --- |
| `GET` | `/api/v1/user/onboarding-status` | `auth()` |
| `PATCH` | `/api/v1/user/onboarding-status` | `auth()`, `validateRequest(OnboardingValidation.updateSchema)` |

`auth()` with no roles — every authenticated role has an onboarding state.

**`checkSubscriptionValidity` is deliberately absent.** Onboarding has to keep working while a company is trialing or payment-blocked. A user who cannot dismiss the welcome modal because their card failed is a support ticket, not a paywall.

### 2.3 Response

Both verbs return the full status, so **a write never needs a follow-up read**.

```jsonc
{
  "statusCode": 200,
  "success": true,
  "message": "Onboarding status retrieved successfully",
  "data": {
    "isOnboardingCompleted": false,
    "currentStepIndex": 2,
    "completedSteps": ["CLIENT_CREATED"],
    "isDismissed": false,
    "isNewUser": true,
    "userCreatedAt": "2026-08-26T09:12:44.000Z"
  }
}
```

### 2.4 PATCH body

Every field optional; only what is sent is written.

| Field | Effect |
| --- | --- |
| `isOnboardingCompleted` | set |
| `isDismissed` | set |
| `currentStepIndex` | set, clamped to `0..100` |
| `completeSteps: string[]` | **union**, never replace |
| `reset: true` | index → 0, completed/dismissed → false, clears only `TOUR_COMPLETED` |

Two rules worth not re-deriving later:

- **`completeSteps` is a verb, and it unions.** Two tabs finishing different tasks must not clobber each other, and a milestone once earned is never un-earned. The merge is done in the service (not Prisma `push`) because `push` would happily store a duplicate, and the checklist counts by length.
- **`reset` keeps real milestones.** Restarting the tour does not delete the client you created. Only tour-describing ids are cleared — see `RESET_CLEARS_STEPS`.

### 2.5 `isNewUser` is computed server-side, and has to be

The frontend has no `created_at` for the logged-in user at all: `buildLogInUserData` (`src/lib/authSession.ts`) projects sign-in down to nine keys and drops it, and `getDecodedUser()` returns only `{ id, email, role, iat, exp }`. Deriving the window from the browser clock would also be wrong — a machine set a month fast would silently suppress the modal for everyone on it.

`User.created_at` is the right clock: a marketing-site signup exists only as a `PendingUser` until `POST /company` promotes it, so the User row is minted when the workspace becomes real. Window: `NEW_USER_WINDOW_DAYS = 14`.

---

## 3. Frontend

### 3.1 Files

| File | Role |
| --- | --- |
| `src/types/onboarding.ts` | Contract: tasks, steps, wire types |
| `src/lib/onboarding/registry.ts` | **The whole tour, declared** — tasks, steps, role gates |
| `src/lib/onboarding/anchors.ts` | Every `data-tour` value + `resolveAnchor` |
| `src/lib/onboarding/useTourTarget.ts` | Finds and measures the target |
| `src/lib/onboarding/useDialogOpen.ts` | Detects an open Radix dialog |
| `src/store/onboardingStore.ts` | Server mirror + tour runtime |
| `src/actions/onboarding/action.ts` | `getOnboardingStatus` / `updateOnboardingStatus` |
| `src/components/Onboarding/OnboardingGate.tsx` | **The orchestrator** |
| `…/OnboardingModal.tsx` | Phase 1 welcome |
| `…/SpotlightOverlay.tsx` | Backdrop + hole + pulse ring |
| `…/TooltipPopover.tsx` | The step bubble (`@floating-ui/react`) |
| `…/ChecklistWidget.tsx` | Sticky getting-started widget |
| `…/TourHandoffDialog.tsx` | Phase 2 → Phase 4 bridge |
| `…/BrandColorPreview.tsx` | Live-preview control |
| `…/CommandBar.tsx` | ⌘K palette (**new** — see §6) |
| `…/TourMenuItem.tsx` | Resume/Restart in the profile menu |

### 3.2 Mounting

One mount, beside `BillingGate`, in `src/app/(main_layout)/layout.tsx`:

```tsx
const currentUser = await getDecodedUser();
…
<OnboardingGate role={currentUser?.role}></OnboardingGate>
```

**Role comes from the server, not `logInUserStore`.** That store is localStorage-backed and is `{}` on a fresh browser, a private window, or after site data is cleared — all states where the user still has valid cookies and a working dashboard. Role decides which steps and tasks exist at all, so getting it wrong shows an admin an employee's checklist. The gate re-publishes it into the store (`setRole`) so `TourMenuItem` can build a role-correct tour too.

### 3.3 Adding an anchor

1. Add a constant to `TOUR_ANCHORS` in `anchors.ts`.
2. Put `data-tour={TOUR_ANCHORS.x}` on **exactly one** element.
3. Reference it from a step in `registry.ts`.

Targets are resolved with `querySelector` **at step entry**, never by a ref collected at mount — `SideBar` is `React.memo` and `Header`/`ProfileDropDown` are separate client trees, so refs miss re-renders.

`resolveAnchor` skips **zero-area** matches. This matters: the desktop sidebar lives in `hidden lg:block`, so below `lg` its anchors still match the selector but measure 0×0. It also means `Header` rendering `ProfileDropDown` and `DarkMoodToggle` twice (desktop + mobile) is fine — exactly one copy has size.

### 3.4 Adding a checklist milestone

1. Add the id to `ONBOARDING_STEPS` in **`backend/…/onboarding.constants.ts`** (zod rejects unknown ids).
2. Add it to `ONBOARDING_TASKS` and `ONBOARDING_TASK_LIST` in the frontend, with its `roles`.
3. Call it from the flow's existing success branch:

```ts
void useOnboardingStore.getState().completeTask("CLIENT_CREATED");
```

`completeTask` is **optimistic and idempotent** — it returns before touching the network if already earned, so firing it on every create (not just the first) is free. It rolls back on failure rather than leaving a tick the server does not know about.

Wired today: `AddClientModal`, `AddBudgetAndHoursStep` (the project wizard's final step — the only place a project is actually created), `AddNewMemberModal`, and the Header's Download App link.

---

## 4. Gotchas that cost real debugging

- **Modals during a tour.** `DialogContent` is `z-50`; the spotlight is `z-[9990]`. Clicking the highlighted "Add Client" button would bury the dialog under the backdrop. `useDialogOpen` watches for `[data-slot="dialog-content"]` and the tour **steps aside** while one is open, resuming on the same step when it closes. Do not "fix" this with a bigger z-index.
- **`setOpenMenu` toggles.** `sidebarStore.ts`: `openMenu === menu ? null : menu`. Firing it blindly on an already-open group closes the thing the step needs. Always check current state (the gate does).
- **`SidebarRouteSync` fights you.** It hard-sets `openMenu` on every pathname change, so any group the tour opened is reset when the tour navigates.
- **Persisting a step writes to `User`,** and the Prisma client extension in `backend/src/app/lib/prisma.ts` invalidates that user's Redis auth entry on every `user.update`. Six "Next" clicks must not be six invalidations — step advances go through a **900 ms trailing debounce**, and `endTour` collapses index + milestone + completion into **one** PATCH.
- **Roles without core steps.** Every core step targets a management-only CTA, so `employee` and `project_manager` have zero. `startTour` bails on an empty list, which would make "Start interactive setup" a dead button. The gate routes them to the orientation tour instead (`openingTour()`).
- **Suspense.** `/project-management/projects` wraps its hero in `<Suspense fallback={null}>`, so "Add Project" is genuinely absent for a moment. `useTourTarget` waits **6 s** before declaring a target missing; the gate then skips that step rather than spotlighting nothing.
- **`isDismissed` covers both surfaces.** "Skip for now" on the welcome modal and the checklist's ✕ both set it, and both hide both. The escape hatch is **Restart product tour** in the profile menu. If you want them independent, split the flag — it is one field and one condition in `OnboardingGate`.

---

## 5. How the spotlight is drawn

`backdrop-filter` cannot have a hole, so:

- **Blur + click shield** = four animated panels tiled around the target. The gap between them is what lets the user click the highlighted control **and nothing else**.
- **Dark tint** = one element inside the hole with `box-shadow: 0 0 0 9999px`. Four rectangles cannot produce a rounded corner; this can.

Both animate on plain numbers (`top/left/width/height`), so moving between steps is a spring on four values rather than an interpolated SVG path. The corner arcs get tint but no blur — invisible at 62% over a few pixels.

`useTourTarget` measures on **every animation frame** while a step is on screen, but only `setState`s when the box actually moves. A frame loop is required because everything it follows moves *without firing an event*: the sidebar's 300 ms width transition, framer-motion's height animation on an expanding nav group, and smooth-scroll-into-view.

---

## 6. Things this feature added that did not exist

- **⌘K command bar** (`CommandBar.tsx`). `cmdk` was already a dependency and shadcn's `CommandDialog` was already in `components/ui`, but **nothing imported it** and there was no global shortcut. The orientation tour's first stop needed something real to point at. Destinations are derived from `SidebarItems.ts`, so they cannot drift from what the sidebar shows a given role.
- **`PopoverClose`** is now exported from `components/ui/popover.tsx`.
- **`data-tour` as a convention** — there were zero `data-tour`/`data-testid` attributes in the repo before this.
- **`@floating-ui/react`** added as a direct dependency (only `@floating-ui/dom`/`react-dom` were present, transitively via Radix).

---

## 7. Journey map

| Phase | Surface | Trigger |
| --- | --- | --- |
| 1 | `OnboardingModal` | `isNewUser && !completed && !dismissed`, on `/dashboard`, once per page load |
| 2 | `core` tour — Clients → Projects → Team | "Start interactive setup" |
| 3 | `TourHandoffDialog` | Core tour finished |
| 4 | `orientation` tour — ⌘K → metrics → sidebar → timer → appearance → profile | "Show me around" |
| — | `ChecklistWidget` | Always, until complete or dismissed |

`currentStepIndex` is a **single integer across both tours**: core occupies `0..2`, orientation continues from `3`. So one column restores both which tour and where in it (`resumePoint`).
