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
| `…/QuickSetupDialog.tsx` | Phase 1 hub — checklist + per-step tutorial video + CTA |
| `src/lib/onboarding/tutorialVideos.ts` | CDN origin + the tutorial clip URL map. Clips are hosted on DigitalOcean Spaces, **not** in `public/`; `NEXT_PUBLIC_TUTORIAL_VIDEO_ORIGIN` overrides the default origin |
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

Wired today: `AddClientModal`, `AddBudgetAndHoursStep` (the project wizard's final step — the only place a project is actually created), `AddNewMemberModal`, the Header's Download App link, and `Download/DownloadButton` (clicking any real installer link — the strongest signal there is, and the one the tour's download step relies on).

---

## 4. Gotchas that cost real debugging

- **Modals during a tour.** `DialogContent` is `z-50`; the spotlight is `z-[9990]`. Clicking the highlighted "Add Client" button would bury the dialog under the backdrop. `useDialogOpen` watches for `[data-slot="dialog-content"]` and the tour **steps aside** while one is open, resuming on the same step when it closes. Do not "fix" this with a bigger z-index.
- **`setOpenMenu` toggles.** `sidebarStore.ts`: `openMenu === menu ? null : menu`. Firing it blindly on an already-open group closes the thing the step needs. Always check current state (the gate does).
- **`SidebarRouteSync` fights you.** It hard-sets `openMenu` on every pathname change, so any group the tour opened is reset when the tour navigates.
- **Persisting a step writes to `User`,** and the Prisma client extension in `backend/src/app/lib/prisma.ts` invalidates that user's Redis auth entry on every `user.update`. Six "Next" clicks must not be six invalidations — step advances go through a **900 ms trailing debounce**, and `endTour` collapses index + milestone + completion into **one** PATCH. The milestone is `TOUR_COMPLETED`, awarded **explicitly** by `endTour({completed:true})` for **either** walkthrough — never by reading the last step's `task`. It is not gated on the orientation tour: that tour is *offered* after the core one and can be declined, so gating on it left a user who pressed Finish and then said "no thanks" with the "Finish the product tour" row unticked forever and no way back to tick it. `completeSteps` is an append-only union, so taking orientation afterwards cannot un-earn it. `isOnboardingCompleted` stays gated on orientation, so declining the extra does not hide the checklist. A step's `task` marks what it *teaches* (the closing download step teaches `DESKTOP_APP_DOWNLOADED`), and milestones are earned by really doing the thing, not by pressing Finish.
- **Roles without core steps.** Every core step targets a management-only CTA, so `employee` and `project_manager` have zero. `startTour` bails on an empty list, which would make "Start interactive setup" a dead button. The gate routes them to the orientation tour instead (`openingTour()`).
- **Suspense.** `/project-management/projects` wraps its hero in `<Suspense fallback={null}>`, so "Add Project" is genuinely absent for a moment. `useTourTarget` waits **6 s** before declaring a target missing; the gate then skips that step rather than spotlighting nothing. A step can raise that budget via `targetTimeoutMs` — the download finale sets **15 s** because its anchor only mounts after `useReleases` settles, and that fetch is allowed 10 s before the pinned fallback renders. A missing target on the **last** step ends the tour as *completed*, not abandoned: the tour has already navigated to the finale's route, and an uncompleted exit would leave the checklist nagging about a tour that can only restart from scratch.
- **Targets the bubble cannot fit beside.** The finale spotlights the whole installer surface, which leaves no room for an anchored bubble on phones (single-column grid) and short laptop windows — `flip` only offers top/bottom and `shift` corrects the cross axis only, so every candidate clips the edge holding the ONLY Finish/close controls. `TooltipPopover` therefore watches the *actual space available* via floating-ui's `size` middleware (re-measured every frame, so the Mac-help accordion growing the target, a resize, or a rotation re-decides it) and renders as a **fixed bottom sheet** whenever the bubble genuinely cannot fit. Do not replace this with a target-height heuristic — the failure condition is space-vs-bubble, not target size.
- **The bubble is positioned with `left`/`top`, never `transform`.** `useFloating` is passed `transform: false`. Its default returns `{position, left: 0, top: 0, transform: translate(x, y)}` — but the bubble is a `motion.div` animating `x`, `y` and `scale`, and framer-motion writes `transform` straight to the node on every frame. The translate was overwritten the moment it landed, leaving the bubble on the `left: 0; top: 0` underneath: **pinned to the viewport's top-left corner**, while the spotlight (which measures the target itself) stayed correct. The bubble is also `visibility: hidden` until `isPositioned`, since floating-ui's coordinates start at `(0,0)` and `computePosition` is async. Never animate `x`/`y` on a floating element positioned by transform.
- **The target tracker publishes on element identity, not just geometry.** `useTourTarget` skips `setState` when the measured rect has not moved — but React can swap the anchor for a *new node at the same position* (a Suspense boundary resolving, a list re-rendering). Publishing only on geometry left the popover holding the **detached** node, which measures 0×0 at the origin: bubble in the top-left corner, spotlight perfectly correct, because the spotlight reads `rect` and the bubble reads `element`. The loop therefore forces an update whenever identity changes, and re-runs a cached node through `resolveAnchor` once it loses its box (a breakpoint hiding the sidebar) instead of spotlighting a 0×0 hole. This was the second, independent cause of the same corner symptom as the `transform` trap above — fixing one alone does not fix the bug. **Losing a target also renews the deadline**, once, on the frame it goes: the original budget expired while the user was reading the bubble, so without that renewal one transient breakpoint cross is declared missing instantly — which skips the step, and on the *last* step ends the tour as completed and awards `TOUR_COMPLETED` for a walkthrough nobody finished. The renewal also buys time to find the other copy, since the header renders the theme toggle and profile menu twice, one per breakpoint.
- **A missing verdict names its anchor.** `useTourTarget`'s "missing" state carries the anchor it gave up on, and the gate ignores a verdict for any other step. Without that, the one-commit window where the gate has advanced but the target state has not yet reset would cascade-skip steps that were never searched — and on the last step, end the tour outright.
- **Escape ends the tour** (unless a dialog is open — Escape belongs to the dialog then, and the tour is already standing aside). This is the only exit that works while a target is still being searched, when the scrim is up and the tooltip's ✕ does not exist yet.
- **The mobile burger nav is a Sheet**, and `useDialogOpen` matches `sheet-content` alongside `dialog-content`: on steps whose spotlight hole is taller than the viewport the click shield cannot cover the header, so the sheet really can open mid-tour and the tour steps aside for it.
- **`isDismissed` covers both surfaces.** "Don't show this again" in Quick Setup and the checklist's ✕ both set it, and both hide both. Quick Setup's ✕/Escape/outside-click are a *soft* close (`closeWelcome`) and record nothing — the widget is right there to reopen it.
- **A Quick Setup CTA leaves a breadcrumb, and the guide comes back.** The CTA closes the dialog and navigates, so the flow would otherwise dead-end exactly where it should feel like progress: the user adds their member, the toast fades, and the guide they were following is gone. `pendingTask` (runtime only — a reload forgets it, rather than ambushing someone later) records which milestone they were sent to do; when it really lands the gate clears it and reopens Quick Setup on the next incomplete row. The reopen waits for `useDialogOpen()` to go false: two Radix modals overlapping fight over the `pointer-events: none` they each put on `<body>`, and the loser leaves the page inert.
- **The checklist widget unmounts while Quick Setup is open.** It is `fixed … z-[80]`, above `ui/dialog`'s `z-50` overlay *and* content, so it would paint brightly over the guide it just launched — and since Radix modal-mode puts `pointer-events: none` on the body, a click on that bright card lands on the overlay and closes the dialog. `showChecklist` therefore includes `&& !welcomeOpen`. The escape hatch is **Restart product tour** in the profile menu. If you want them independent, split the flag — it is one field and one condition in `OnboardingGate`.

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
| 1 | `QuickSetupDialog` — two panes: the step list on the left, the selected step's tutorial video (`IOnboardingTask.videoSrc`, a CDN URL from `src/lib/onboarding/tutorialVideos.ts` — the clips are hosted on DigitalOcean Spaces, not shipped in `public/`) or a static poster panel plus one CTA on the right. Both panes read one `QuickSetupRow[]` built in the component: row 0 is the always-done **workspace** row (not an `OnboardingTaskId` — no column tracks it, and reaching the dashboard means `POST /company` already succeeded), then the role-visible milestones. Keep new non-milestone rows in that array rather than special-casing them downstream. The workspace row names the organization when it can (`workspaceName`, fetched by `getCompanyInfo()` in the layout and threaded through the gate exactly like `role` — no client store holds the company name, `buildLogInUserData` keeps only `company_id`) and falls back to "Your workspace is ready" when it cannot | Auto: `isNewUser && !completed && !dismissed && done === 0`, on `/dashboard`, once per page load. Manual: the checklist widget's "Open setup guide", or Restart in the profile menu. ✕/Escape close softly (`closeWelcome`); only "Don't show this again" records `isDismissed` |
| 2 | `core` tour — Clients → Projects → Team | Explicit opt-in only: the Quick Setup tour row, the checklist widget's "Start tour", Resume/Restart in the profile menu. A Quick Setup **milestone** CTA deliberately does *not* start it — it closes the dialog and navigates (`closeWelcome` + `router.push(task.href)`), because the centered guide is the tour and hijacking that click into a seven-step overlay is what made the old onboarding feel like an obstacle |
| 3 | `TourHandoffDialog` | Core tour finished |
| 4 | `orientation` tour — ⌘K → metrics → sidebar → timer → appearance → profile → **download (`/download`, the finale)** | "Show me around", or the Quick Setup tour row's "Start/Resume tour" (core-first for management roles, via `handleResume`) |
| — | `ChecklistWidget` | Always, until complete or dismissed |

`currentStepIndex` is a **single integer across both tours**: core occupies `0..2`, orientation continues from `3`. So one column restores both which tour and where in it (`resumePoint`).
