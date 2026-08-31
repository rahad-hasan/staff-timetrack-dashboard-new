"use client";

import { useEffect, useRef, useState } from "react";
import { create } from "zustand";
import { CREATE_ACTIONS, CreateActionKind } from "@/lib/quickActions";
import { useDialogOpen } from "@/lib/onboarding/useDialogOpen";

/**
 * One-shot "open the create dialog when you get there" intent.
 *
 * Raised by whatever the user clicked (Quick Setup's CTA, the getting-started
 * widget, the ⌘K palette, the profile menu's "Add member to team"), claimed
 * exactly once by the hero section that owns that dialog. It is what turns
 * "Add client" from a navigation into the action it says it is: press the
 * button, land on the page with the form already open.
 *
 * A store rather than an `?create=client` query param, deliberately. The
 * clients, projects, members and tasks lists are all server components under a
 * `Suspense` boundary keyed on their search params, so putting the flag in the
 * URL would refetch the table and flash its skeleton — twice, since the flag
 * then has to be stripped again so a refresh does not reopen the dialog. Two
 * of those pages (`ClientHereSection`, `TaskHeroSection`) already rewrite their
 * own query string on mount, which a create flag would have to survive. This is
 * purely client-side UI state and the URL is the wrong place for it.
 *
 * Supersedes the single-purpose `memberInviteStore` this generalises.
 */

/**
 * How long an unclaimed intent stays live.
 *
 * Consume-on-claim is the real mechanism; this is the safety net for the case
 * where the claimant never mounts — the navigation is abandoned mid-flight, or
 * the target page renders without its trigger. Without it the intent would sit
 * in memory until a full reload and fire on a later, unrelated visit to the
 * page, which reads as a modal opening by itself. Generous enough that no real
 * client navigation loses the race; expiring degrades to plain navigation,
 * which is exactly the old behaviour.
 */
const INTENT_TTL_MS = 30_000;

interface PendingCreate {
  kind: CreateActionKind;
  /** Page that owns the dialog. Recorded for debugging and intent provenance. */
  route: string;
  /** Wall clock at request time, for the staleness guard above. */
  issuedAt: number;
}

interface QuickActionStore {
  /** At most one intent is ever in flight — a second click replaces the first. */
  pending: PendingCreate | null;
  /** Raise the intent, then navigate. Order matters: see `useCreateIntent`. */
  requestCreate: (kind: CreateActionKind) => void;
  /**
   * Claim the intent. Returns true at most once per request, and only to the
   * matching kind — so a stray mount of another hero section cannot swallow
   * it. An expired intent is dropped and reported as unclaimed.
   */
  claimCreate: (kind: CreateActionKind) => boolean;
  clearCreate: () => void;
}

export const useQuickActionStore = create<QuickActionStore>((set, get) => ({
  pending: null,

  requestCreate: (kind) =>
    set({
      pending: {
        kind,
        route: CREATE_ACTIONS[kind].href,
        issuedAt: Date.now(),
      },
    }),

  claimCreate: (kind) => {
    const pending = get().pending;
    if (!pending || pending.kind !== kind) return false;

    // Read and clear with no await in between, so React 18 StrictMode's
    // double-invoked effect — or two claimants racing — cannot both win.
    set({ pending: null });

    return Date.now() - pending.issuedAt <= INTENT_TTL_MS;
  },

  clearCreate: () => set({ pending: null }),
}));

/**
 * Claim a pending create intent for `kind` and open the dialog.
 *
 * Called by the component that owns the dialog; `open` is that component's own
 * "show it" action, so this hook never needs to know what the dialog is.
 *
 * Two subtleties it exists to absorb:
 *
 *  - It reacts to the *store*, not to mount. The user may already be on the
 *    page they are being sent to — clicking "Create project" from the guide
 *    while standing on /projects is a no-op navigation, and a mount-only claim
 *    would do nothing at all.
 *  - It waits for the surface to clear. The dialog the click came from (Quick
 *    Setup, the ⌘K palette) is a Radix modal mid-exit-animation, and two Radix
 *    modals overlapping fight over the `pointer-events: none` they each put on
 *    <body> — the loser leaves the page inert. The same stand-aside
 *    `OnboardingGate` already does when it reopens the guide after a create.
 */
export function useCreateIntent(kind: CreateActionKind, open: () => void): void {
  const pending = useQuickActionStore((state) => state.pending);
  const claimCreate = useQuickActionStore((state) => state.claimCreate);

  /** Claimed and waiting for a clear screen. */
  const [armed, setArmed] = useState(false);
  const dialogOnScreen = useDialogOpen();

  // `open` is an inline arrow at every call site; keeping it in a ref means a
  // re-render cannot re-fire the effect below and reopen a dialog the user
  // just closed.
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  });

  useEffect(() => {
    if (pending?.kind !== kind) return;
    if (claimCreate(kind)) setArmed(true);
  }, [pending, kind, claimCreate]);

  useEffect(() => {
    if (!armed || dialogOnScreen) return;

    // Disarm first: `open()` mounts a dialog, which flips `dialogOnScreen` and
    // re-runs this effect. Clearing the flag in the same commit makes that
    // pass a no-op instead of a loop.
    setArmed(false);
    openRef.current();
  }, [armed, dialogOnScreen]);
}
