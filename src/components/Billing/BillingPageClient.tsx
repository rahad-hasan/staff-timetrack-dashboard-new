"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { ChevronLeft, X } from "lucide-react";
import { toast } from "sonner";

import { IBillingPlan, IBillingStatus } from "@/types/billing";
import { canMutateSubscription } from "@/lib/billing";
import { useBillingStore } from "@/store/billingStore";
import { Button } from "@/components/ui/button";
import CurrentPlanCard from "@/components/Billing/CurrentPlanCard";
import PayNowCard from "@/components/Billing/PayNowCard";
import SubscriptionEndedScreen from "@/components/Billing/SubscriptionEndedScreen";
import PlanPricingSection from "@/components/Billing/PlanPricingSection";
import RestoreParkedDialog from "@/components/Billing/RestoreParkedDialog";
import TrialEndedOptions from "@/components/Billing/TrialEndedOptions";
import DowngradeTakeover from "@/components/Billing/DowngradeTakeover";
import BillingTabs, {
  useBillingTab,
  useScrollToPlans,
} from "@/components/Billing/BillingTabs";
import InvoiceTab from "@/components/Billing/InvoiceTab";
import RefundsTab from "@/components/Billing/Refund/RefundsTab";
import ChangeCardTab from "@/components/Billing/PaymentMethod/ChangeCardTab";
import { adoptServerBillingStatus } from "@/components/Billing/adoptServerBillingStatus";
import Link from "next/link";

/**
 * /settings/billing orchestrator (contract §21). Hands the server-rendered
 * snapshot to the billing store and lays out the page surfaces in the contract
 * order. The pending_downgrade takeover is handled globally by BillingGate —
 * nothing extra here.
 *
 * The page is split into My Plan / Invoice / Change Card tabs driven by
 * `?tab=`, but only the *informational* surfaces moved into them.
 */
export default function BillingPageClient({
  initialStatus,
  statusFetchedAt,
  plans,
  activeUserCount,
  role,
  blockedMessage,
}: {
  initialStatus: IBillingStatus | null;
  /** Server `Date.now()` taken with `initialStatus` — see `adoptServerBillingStatus`. */
  statusFetchedAt: number;
  plans: IBillingPlan[];
  activeUserCount: number;
  role: string;
  blockedMessage?: string;
}) {
  const status = useBillingStore((s) => s.status);
  const startPolling = useBillingStore((s) => s.startPolling);

  const [blockedDismissed, setBlockedDismissed] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

  const isAdmin = role === "admin";

  const { activeTab, setTab } = useBillingTab({ isAdmin });

  /**
   * Handed to the recovery surfaces above the strip. They are billing-page
   * only in their inline form but are also mounted globally by BillingGate, so
   * the tab-aware scroll is injected rather than imported there — see the prop
   * docs on TrialEndedOptions / DowngradeTakeover.
   */
  const scrollToPlans = useScrollToPlans();

  // The store once it holds anything, else the server snapshot. The server
  // and hydration renders always take the second branch: they read the
  // store's initial state (zustand's server snapshot), never a live one — so
  // the first paint is exactly what the server fetched. Everything below,
  // children included, renders from `effective` rather than from the store,
  // which is what keeps a paying customer from flashing "No subscription".
  const effective = status ?? initialStatus;
  const entitlements = effective?.entitlements ?? null;
  const st = entitlements?.status;
  // Live head count from the refreshed status; the server-rendered prop is the
  // first-paint fallback, so seat usage stays correct after every refetch
  // without re-rendering the page.
  const seatCount = effective?.active_user_count ?? activeUserCount;

  // Every server render of this page is the freshest snapshot there is — the
  // first visit, a tab revisited after checkout, the re-render a billing
  // write ships with its response — so it goes into the store (unless it is a
  // Back/Forward restore of one already adopted). Before paint, so a client
  // navigation never shows a frame of the store's older copy.
  //
  // A restore is the one mount without a fresh snapshot: the router replays
  // the page as first rendered, with no request at all, so whatever changed
  // since (a co-admin's purchase, a failed renewal) is in neither the props
  // nor, unless something else read it, the store. Read it then.
  useLayoutEffect(() => {
    if (adoptServerBillingStatus(initialStatus, statusFetchedAt) === "replayed") {
      void useBillingStore.getState().fetchStatus();
    }
  }, [initialStatus, statusFetchedAt]);

  // Otherwise only a failed server read leaves anything to fetch here.
  useEffect(() => {
    if (initialStatus) return;
    (async () => {
      try {
        await useBillingStore.getState().fetchStatus();
      } catch {
        toast.error(
          "Could not refresh billing status. Please reload the page.",
        );
      }
    })();
    // A failed first read is retried once, on mount.
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
      return startPolling(5000);
    }
    return undefined;
  }, [st, hasUnpaidInvoice, startPolling]);

  return (
    <div className="mt-4 space-y-4 sm:space-y-6">
      <div className=" flex justify-between">
        <BillingTabs
          activeTab={activeTab}
          onChange={setTab}
          isAdmin={isAdmin}
        />
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 mt-3 sm:mt-0 text-sm text-subTextColor hover:text-headingTextColor dark:text-darkTextSecondary dark:hover:text-darkTextPrimary"
        >
          <ChevronLeft size={16} />
          Back to Settings
        </Link>
      </div>
      {/* ──────────────────────────────────────────────────────────────────
          EVERYTHING BELOW, UP TO THE TAB STRIP, IS DELIBERATELY OUTSIDE THE
          TABS AND MUST STAY THERE.

          The blocked banner, PayNowCard, the trial-ended card with
          TrialEndedOptions, DowngradeTakeover and SubscriptionEndedScreen are
          the recovery path for a payment-blocked account, and this page is
          where every 402 redirect and every `block.webBillingUrl` in the app
          lands. Putting any of them behind an inactive tab means a locked
          workspace opens on a tab that shows nothing actionable, and the admin
          has no way to know a second click would reveal the invoice that
          unlocks them — the workspace becomes unrecoverable from the UI.
          ────────────────────────────────────────────────────────────────── */}
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
            <TrialEndedOptions onUpgradeClick={scrollToPlans} />
          </div>
        )}

      {st === "pending_downgrade_selection" && (
        <div className="border border-borderColor rounded-lg p-4 sm:p-6 bg-white dark:bg-darkPrimaryBg dark:border-darkBorder">
          <DowngradeTakeover
            variant="inline"
            role={role}
            onUpgradeClick={scrollToPlans}
          />
        </div>
      )}

      {st === "canceled" && <SubscriptionEndedScreen />}

      {/* Inactive tabs are UNMOUNTED, not hidden: the invoice table would
          otherwise fetch (and self-heal from Stripe) for someone who never
          opened it, and a hidden #plans anchor would still swallow the
          "View plans" scroll. `useScrollToPlans` handles the tab swap. */}
      {activeTab === "my-plan" && (
        <div className="space-y-4 sm:space-y-6">
          <CurrentPlanCard
            plans={plans}
            activeUserCount={seatCount}
            entitlements={entitlements}
            isAdmin={isAdmin}
            serverNow={statusFetchedAt}
          />

          <PlanPricingSection
            plans={plans}
            activeUserCount={seatCount}
            entitlements={entitlements}
            isAdmin={isAdmin}
            sectionId="plans"
          />

          {isAdmin && canMutateSubscription(entitlements, plans) && (
            <div>
              <Button
                type="button"
                variant="link"
                className="px-0"
                onClick={() => setRestoreOpen(true)}
              >
                Previously parked members or projects?
              </Button>
              <RestoreParkedDialog
                open={restoreOpen}
                onOpenChange={setRestoreOpen}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === "invoice" && <InvoiceTab />}

      {activeTab === "refunds" && <RefundsTab isAdmin={isAdmin} />}

      {activeTab === "change-card" && (
        <ChangeCardTab onViewBilling={() => setTab("invoice")} />
      )}
    </div>
  );
}
