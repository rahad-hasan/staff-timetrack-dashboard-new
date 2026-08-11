"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { BillingBlockCode } from "@/types/billing";
import { useBillingStore } from "@/store/billingStore";
import TrialBanner from "./TrialBanner";
import PaymentFailureBanner from "./PaymentFailureBanner";
import BlockedTakeover from "./BlockedTakeover";
import DowngradeTakeover from "./DowngradeTakeover";
import AddSeatsDialog from "./AddSeatsDialog";

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
 * AddSeatsDialog is always mounted — it self-controls via the store.
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

const isBillingPath = (pathname: string | null): boolean =>
  !!pathname &&
  (pathname.startsWith("/settings/billing") || pathname.startsWith("/billing"));

export default function BillingGate() {
  const status = useBillingStore((s) => s.status);
  const loaded = useBillingStore((s) => s.loaded);
  const fetchStatus = useBillingStore((s) => s.fetchStatus);
  const startPolling = useBillingStore((s) => s.startPolling);
  const stopPolling = useBillingStore((s) => s.stopPolling);
  const pathname = usePathname();

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const st = status?.entitlements?.status ?? null;
  const onBillingPage = isBillingPath(pathname);

  const showDowngradeTakeover =
    st === "pending_downgrade_selection" && !onBillingPage;

  const takeoverBlock =
    !showDowngradeTakeover &&
    !onBillingPage &&
    status?.blocked &&
    status.block &&
    TAKEOVER_BLOCK_CODES.includes(status.block.code)
      ? status.block
      : null;

  // A full-screen takeover offers non-admins no action that refetches, so
  // without polling they stay blocked even after the admin pays or the worker
  // resolves the state in another session. Slow-poll while one is up; the
  // next status flip swaps the surface automatically.
  const takeoverActive = showDowngradeTakeover || !!takeoverBlock;
  useEffect(() => {
    if (!takeoverActive) return undefined;
    startPolling(30000);
    return () => stopPolling();
  }, [takeoverActive, startPolling, stopPolling]);

  if (!loaded) return null;

  return (
    <>
      {st === "trialing" && (
        <TrialBanner
          trialEndsAt={status?.entitlements?.trial_ends_at ?? null}
        />
      )}
      {(st === "past_due" || st === "payment_failed") && (
        <PaymentFailureBanner />
      )}
      {showDowngradeTakeover && <DowngradeTakeover />}
      {takeoverBlock && <BlockedTakeover block={takeoverBlock} />}
      <AddSeatsDialog />
    </>
  );
}
