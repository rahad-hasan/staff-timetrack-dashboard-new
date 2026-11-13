"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { BillingBlockCode, IBillingStatus } from "@/types/billing";
import { useBillingStore } from "@/store/billingStore";
import { useLogInUserStore } from "@/store/logInUserStore";
import TrialBanner from "./TrialBanner";
import PaymentFailureBanner from "./PaymentFailureBanner";
import { adoptServerBillingStatus } from "./adoptServerBillingStatus";
import { loadOrReload } from "@/lib/lazyChunk";
import { toast } from "sonner";
import OverlayErrorBoundary from "@/components/Common/OverlayErrorBoundary";

/**
 * Global billing orchestrator (contract §5) — mounted ONCE in (main_layout).
 * Fetches billing/status on mount and renders the right surface for each
 * state of the billing state machine (guide §1):
 *   - trialing                      → TrialBanner
 *   - past_due / payment_failed    → PaymentFailureBanner (banner ONLY — the
 *     dashboard stays browsable; SUBSCRIPTION_PAST_DUE never takes over)
 *   - pending_downgrade_selection  → DowngradeTakeover (full-screen)
 *   - other hard block codes       → BlockedTakeover (full-screen)
 * Takeovers are suppressed on /settings/billing and /billing paths so those
 * pages stay reachable (the "upgrade instead" escape hatch).
 * AddSeatsDialog self-controls via the store; it mounts on its first open.
 */

/**
 * Block codes that take over the screen. SUBSCRIPTION_PAST_DUE is banner-only
 * and SELECTION_REQUIRED is handled by DowngradeTakeover instead.
 */
const TAKEOVER_BLOCK_CODES: BillingBlockCode[] = [
  "TRIAL_EXPIRED",
  "SUBSCRIPTION_CANCELED",
  "SUBSCRIPTION_REQUIRED",
  "SUBSCRIPTION_EXPIRED",
  "COMPANY_DEACTIVATED",
];

/**
 * Who `GET /packages/billing/status` answers — the backend route is
 * `auth('admin', 'manager', 'hr')`. Everyone else gets a 403, so for the
 * most numerous role there is nothing to fetch, and nothing was ever shown.
 */
const BILLING_STATUS_ROLES = ["admin", "manager", "hr"];

/** An unknown role still reads (the server is the judge), as it always has. */
const mayReadBillingStatus = (role: unknown): boolean =>
  typeof role !== "string" ||
  !role.trim() ||
  BILLING_STATUS_ROLES.includes(role.trim().toLowerCase());

/**
 * How stale the snapshot may be before coming back to the tab re-reads it.
 * The store's poll engine re-reads on return only while a surface holds a
 * poll claim (a payment being settled); this covers every other state — a
 * trial that ran out, seats another admin bought, a refund that ended the
 * plan — without a read on every quick tab flip.
 */
const STALE_ON_RETURN_MS = 60_000;

const isBillingPath = (pathname: string | null): boolean =>
  !!pathname &&
  (pathname.startsWith("/settings/billing") || pathname.startsWith("/billing"));

/**
 * Opaque stand-in while a takeover's code loads, painted like the takeover
 * itself: the page underneath must not be usable for that moment either.
 */
const takeoverPlaceholder = (className: string) => {
  const Placeholder = () => (
    <div aria-busy="true" className={`fixed inset-0 z-[100] ${className}`} />
  );
  return Placeholder;
};


// The takeovers (the downgrade wizard, the trial-end options) and the
// add-seats flow are rare states, so their code stays out of the bundle every
// dashboard page loads and is fetched when one is actually shown. Never
// server-rendered (`ssr: false`): when the layout's snapshot calls for a
// takeover, the server HTML and the hydration pass both paint its opaque
// placeholder, and the real surface replaces it once its chunk is in.
//
// The loaders are named constants on purpose: Next's compile step rewrites a
// `dynamic()` whose first argument is a call expression (`dynamic(f(...))`
// becomes `dynamic(() => f(...))`), which would hand it a function instead of
// a promise. An identifier is left alone — the same shape as the support and
// calendar dialogs.
/** One toast however many billing surfaces fail (fixed id). */
const notifyBillingLoadFailure = () =>
  toast.error("Billing information couldn't load", {
    id: "billing-surface-failed",
    description: "Reload the page to try again.",
    action: { label: "Reload", onClick: () => window.location.reload() },
  });

const loadDowngradeTakeover = loadOrReload(() => import("./DowngradeTakeover"));
const loadBlockedTakeover = loadOrReload(() => import("./BlockedTakeover"));
const loadAddSeatsDialog = loadOrReload(() => import("./AddSeatsDialog"));

const DowngradeTakeover = dynamic(loadDowngradeTakeover, {
  ssr: false,
  loading: takeoverPlaceholder("bg-bgSecondary dark:bg-darkSecondaryBg"),
});
const BlockedTakeover = dynamic(loadBlockedTakeover, {
  ssr: false,
  loading: takeoverPlaceholder("bg-gray-50 dark:bg-darkPrimaryBg"),
});
const AddSeatsDialog = dynamic(loadAddSeatsDialog, { ssr: false });

export interface BillingGateProps {
  /**
   * The viewer's role as the server sees it (the layout's live session).
   * Optional: without it the persisted login store's role decides.
   */
  role?: string | null;
  /**
   * A billing/status snapshot the layout read in its own render. When it is
   * given the gate renders from it on the first paint and skips its own
   * mount fetch (unless it is a restored one: see the hand-over effect);
   * omitted, the gate fetches on mount.
   */
  initialStatus?: IBillingStatus | null;
  /** Server `Date.now()` taken before that read — see `adoptServerBillingStatus`. */
  statusFetchedAt?: number;
}

export default function BillingGate({
  role,
  initialStatus,
  statusFetchedAt,
}: BillingGateProps = {}) {
  const status = useBillingStore((s) => s.status);
  const loaded = useBillingStore((s) => s.loaded);
  const fetchStatus = useBillingStore((s) => s.fetchStatus);
  const startPolling = useBillingStore((s) => s.startPolling);
  const addSeatsOpen = useBillingStore((s) => s.addSeatsOpen);
  /**
   * Subscribed only so the fetch below re-runs if the persisted role changes
   * (a session sync correcting it). The effect itself reads the store's live
   * value: in the hydration render this selector still returns the empty
   * server state, which would read as "role unknown" and fetch for everyone.
   */
  const storedRole = useLogInUserStore((s) => s.logInUserData?.role);
  const pathname = usePathname();

  const serverSnapshot =
    initialStatus && typeof statusFetchedAt === "number" ? initialStatus : null;

  /**
   * True when the viewer's role is one the API never shows billing status to
   * (the live role decides; the cached one only when the layout could not
   * read it). Anything the store still holds then dates from before a
   * demotion. A refused poll keeps the old status (only `loaded` changes), so
   * its banner, and the banner's 5 s poll answered by 403s, would otherwise
   * stay until a full reload.
   */
  const barred = !mayReadBillingStatus(role ?? storedRole);
  useEffect(() => {
    // Drops the status, every poll claim and any read in flight. The
    // surfaces holding a claim unmount with this render, so nothing re-arms.
    if (barred) useBillingStore.getState().reset();
  }, [barred]);

  useLayoutEffect(() => {
    if (!serverSnapshot || typeof statusFetchedAt !== "number") return;
    if (adoptServerBillingStatus(serverSnapshot, statusFetchedAt) !== "replayed") {
      return;
    }
    // Mounted on a snapshot this tab was handed before: the router put the
    // dashboard layout back from its cache (returning from a /billing page,
    // which sits outside it) instead of rendering it. That copy is as old as
    // its first render — the trial, on the way back from paying — and nothing
    // else reads on this path, so read here. A first load never comes this
    // way: a rendered layout carries a new stamp.
    if (mayReadBillingStatus(role ?? useLogInUserStore.getState().logInUserData?.role)) {
      void fetchStatus();
    }
  }, [serverSnapshot, statusFetchedAt, role, fetchStatus]);

  useEffect(() => {
    if (serverSnapshot) return;
    if (!mayReadBillingStatus(role ?? useLogInUserStore.getState().logInUserData?.role)) {
      return;
    }
    void fetchStatus();
  }, [serverSnapshot, role, storedRole, fetchStatus]);

  useEffect(() => {
    let lastReadAt = Date.now();
    const unsubscribe = useBillingStore.subscribe((state, previous) => {
      if (state.status !== previous.status) lastReadAt = Date.now();
    });
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastReadAt < STALE_ON_RETURN_MS) return;
      if (!mayReadBillingStatus(role ?? useLogInUserStore.getState().logInUserData?.role)) {
        return;
      }
      lastReadAt = Date.now();
      void useBillingStore.getState().fetchStatus();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [role]);

  /**
   * Mounted on its first open, then kept: closing must still run Radix's exit
   * animation, and the dialog resets its own state on every reopen.
   */
  const [addSeatsMounted, setAddSeatsMounted] = useState(false);
  useEffect(() => {
    if (addSeatsOpen) setAddSeatsMounted(true);
  }, [addSeatsOpen]);

  // Nothing at all for a barred role, so no surface below claims a poll.
  const effective = barred ? null : (status ?? serverSnapshot);
  const st = effective?.entitlements?.status ?? null;
  const onBillingPage = isBillingPath(pathname);

  const showDowngradeTakeover =
    st === "pending_downgrade_selection" && !onBillingPage;

  const takeoverBlock =
    !showDowngradeTakeover &&
    !onBillingPage &&
    effective?.blocked &&
    effective.block &&
    TAKEOVER_BLOCK_CODES.includes(effective.block.code)
      ? effective.block
      : null;

  // A full-screen takeover offers non-admins no action that refetches, so
  // without polling they stay blocked even after the admin pays or the worker
  // resolves the state in another session. Slow-poll while one is up; the
  // next status flip swaps the surface automatically.
  const takeoverActive = showDowngradeTakeover || !!takeoverBlock;
  useEffect(() => {
    if (!takeoverActive) return undefined;
    return startPolling(30000);
  }, [takeoverActive, startPolling]);

  if (barred || (!loaded && !serverSnapshot)) return null;

  return (
    <>
      {st === "trialing" && (
        <TrialBanner
          trialEndsAt={effective?.entitlements?.trial_ends_at ?? null}
          serverNow={statusFetchedAt}
        />
      )}
      {(st === "past_due" || st === "payment_failed") && (
        <PaymentFailureBanner status={effective} />
      )}
      {/* Each lazy surface in its own boundary: if its chunk cannot load even
          after loadOrReload's one reload, fail closed (hide it, say so)
          instead of taking down the whole app-wide layout. Hiding a payment
          takeover is safe — the API still rejects a blocked company's writes
          with 402, which baseApi turns into a redirect to /settings/billing. */}
      <OverlayErrorBoundary label="billing-takeover" onError={notifyBillingLoadFailure}>
        {showDowngradeTakeover && <DowngradeTakeover role={role} />}
        {takeoverBlock && <BlockedTakeover block={takeoverBlock} role={role} />}
      </OverlayErrorBoundary>
      <OverlayErrorBoundary label="add-seats" onError={notifyBillingLoadFailure}>
        {(addSeatsOpen || addSeatsMounted) && <AddSeatsDialog />}
      </OverlayErrorBoundary>
    </>
  );
}
