"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";

import { IBillingPlan, IBillingStatus } from "@/types/billing";
import { canMutateSubscription } from "@/lib/billing";
import { useBillingStore } from "@/store/billingStore";
import { Button } from "@/components/ui/button";

import CurrentPlanCard from "@/components/Billing/CurrentPlanCard";
import SeatUsageCard from "@/components/Billing/SeatUsageCard";
import PayNowCard from "@/components/Billing/PayNowCard";
import SubscriptionEndedScreen from "@/components/Billing/SubscriptionEndedScreen";
import PlanPricingSection from "@/components/Billing/PlanPricingSection";
import RestoreParkedDialog from "@/components/Billing/RestoreParkedDialog";
import InvoiceHistoryTable from "@/components/Billing/InvoiceHistoryTable";
import TrialEndedOptions from "@/components/Billing/TrialEndedOptions";
import DowngradeTakeover from "@/components/Billing/DowngradeTakeover";

/**
 * /settings/billing orchestrator (contract §21). Seeds the billing store with
 * the server-rendered snapshot, refreshes it on mount, and lays out the page
 * surfaces in the contract order. The pending_downgrade takeover is handled
 * globally by BillingGate — nothing extra here.
 */
export default function BillingPageClient({
  initialStatus,
  plans,
  activeUserCount,
  role,
  blockedMessage,
}: {
  initialStatus: IBillingStatus | null;
  plans: IBillingPlan[];
  activeUserCount: number;
  role: string;
  blockedMessage?: string;
}) {
  const status = useBillingStore((s) => s.status);
  const startPolling = useBillingStore((s) => s.startPolling);
  const stopPolling = useBillingStore((s) => s.stopPolling);

  const [blockedDismissed, setBlockedDismissed] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

  const isAdmin = role === "admin";

  // Prefer the live store status; fall back to the server snapshot for the
  // very first paint (the store is seeded in the mount effect below).
  const effective = status ?? initialStatus;
  const st = effective?.entitlements?.status;
  // Live head count from the refreshed status; the server-rendered prop is the
  // first-paint fallback, so seat usage stays correct after every refetch
  // without re-rendering the page.
  const seatCount = effective?.active_user_count ?? activeUserCount;

  // Seed the store when it hasn't loaded yet, then refresh from the API.
  useEffect(() => {
    if (!useBillingStore.getState().loaded) {
      useBillingStore.setState({ status: initialStatus, loaded: true });
    }
    (async () => {
      try {
        await useBillingStore.getState().fetchStatus();
      } catch {
        toast.error("Could not refresh billing status. Please reload the page.");
      }
    })();
    // Seed + initial refresh run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll every 5s while there is anything to settle: a lockout state, or a
  // declined upgrade proration surfaced on an ACTIVE subscription (the seat/
  // plan change stays parked until it's paid — the invoice resolves by
  // payment or by Stripe voiding it on expiry, so polling is bounded either
  // way). Stops when it clears or on unmount.
  const hasUnpaidInvoice = Boolean(effective?.latest_unpaid_invoice);
  useEffect(() => {
    if (st === "past_due" || st === "payment_failed" || hasUnpaidInvoice) {
      startPolling(5000);
      return () => stopPolling();
    }
    return undefined;
  }, [st, hasUnpaidInvoice, startPolling, stopPolling]);

  return (
    <div className="mt-4 space-y-4 sm:space-y-6">
      {blockedMessage && !blockedDismissed && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4 dark:border-red-500/30 dark:bg-red-500/10">
          <p className="text-sm text-red-700 dark:text-red-300">
            {blockedMessage}
          </p>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setBlockedDismissed(true)}
            className="shrink-0 cursor-pointer text-red-700 hover:text-red-900 dark:text-red-300 dark:hover:text-red-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* The server decides when an invoice needs settling — on lockout
          states AND on active subscriptions with a declined seat/plan-change
          proration (which no longer locks the workspace). Render whenever it
          is present; the card itself adapts its urgency to the context. */}
      {effective?.latest_unpaid_invoice && (
        <div id="pay-now">
          <PayNowCard
            invoice={effective.latest_unpaid_invoice}
            blocking={st === "past_due" || st === "payment_failed"}
          />
        </div>
      )}

      {/* The global takeovers are suppressed on this page (it is the escape
          hatch), so both trial-end states get their inline equivalents here. */}
      {isAdmin &&
        effective?.blocked &&
        effective.block?.code === "TRIAL_EXPIRED" && (
          <div className="border border-borderColor rounded-lg p-4 sm:p-6 bg-white dark:bg-darkPrimaryBg dark:border-darkBorder text-center">
            <h3 className="text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">
              Your trial has ended
            </h3>
            <p className="mx-auto mt-1 mb-4 max-w-xl text-sm text-subTextColor dark:text-darkTextSecondary">
              Keep everything by upgrading to a paid plan below, or move to the
              Free plan now — your data is all still here.
            </p>
            <TrialEndedOptions />
          </div>
        )}

      {st === "pending_downgrade_selection" && (
        <div className="border border-borderColor rounded-lg p-4 sm:p-6 bg-white dark:bg-darkPrimaryBg dark:border-darkBorder">
          <DowngradeTakeover variant="inline" />
        </div>
      )}

      {st === "canceled" && <SubscriptionEndedScreen />}

      <div className="grid md:grid-cols-2 gap-4">
        <CurrentPlanCard />
        <SeatUsageCard activeUserCount={seatCount} />
      </div>

      <PlanPricingSection
        plans={plans}
        activeUserCount={seatCount}
        sectionId="plans"
      />

      {isAdmin && canMutateSubscription(effective?.entitlements, plans) && (
        <div>
          <Button
            type="button"
            variant="link"
            className="px-0"
            onClick={() => setRestoreOpen(true)}
          >
            Previously parked members or projects?
          </Button>
          <RestoreParkedDialog open={restoreOpen} onOpenChange={setRestoreOpen} />
        </div>
      )}

      <InvoiceHistoryTable />
    </div>
  );
}
