"use client";

import { Button } from "@/components/ui/button";
import { daysUntil, formatBillingDate, isDatePast } from "@/lib/billing";
import { IBillingEntitlements, IBillingPlan } from "@/types/billing";
import { useViewerTimeZone } from "@/components/Common/ViewerTimeZone";
import { useBillingNow } from "./useBillingNow";
import BillingStatusChip from "./BillingStatusChip";
import CancelSubscriptionDialog from "./CancelSubscriptionDialog";
import { useScrollToPlans } from "./BillingTabs";
import SeatUsageCard from "./SeatUsageCard";
import BillingIcon from "../Icons/PlanIcons/BillingIcon";
import TrailCalenderIcon from "../Icons/PlanIcons/TrailCalenderIcon";

/**
 * Billing page hero card — current plan, cycle, renewal/trial dates, pending
 * downgrade note and (admin + active only) the cancel-subscription entry point.
 * Canceled subscriptions show their access-until/ended date and a reactivate
 * CTA that jumps to the pricing grid, where the old plan's card re-buys via
 * checkout.
 *
 * `entitlements` and `isAdmin` arrive as props, never from the billing or
 * login stores: both stores are empty in the server and hydration renders, so
 * reading them here painted "No subscription" (and no admin buttons) for a
 * paying customer until the client caught up. BillingPageClient resolves them
 * from the live store with the server snapshot as the first-paint fallback.
 *
 * `plans` is passed only to recover the current plan's tagline: the entitlement
 * snapshot carries plan_id/plan_name/tier but no marketing copy, and it is
 * cached, so the description must come from the live plans list. A company
 * sitting on a retired plan simply finds no match and shows no tagline.
 *
 * The page server-renders it, so its dates and countdown follow the same rule
 * as the trial banner: the viewer's zone, and the snapshot's stamp as "now"
 * until hydration is over (`serverNow`, see `useBillingNow`).
 */
export default function CurrentPlanCard({
  plans,
  activeUserCount,
  entitlements,
  isAdmin,
  serverNow,
}: {
  plans: IBillingPlan[];
  activeUserCount: number;
  entitlements: IBillingEntitlements | null;
  isAdmin: boolean;
  /** Server `Date.now()` taken with the snapshot `entitlements` came from. */
  serverNow?: number;
}) {
  const timeZone = useViewerTimeZone();
  const now = useBillingNow(serverNow);
  // The pricing grid lives inside the My Plan tab body, so a bare
  // `getElementById("plans")` is a dead button from any other tab — the anchor
  // is not in the DOM. The shared hook switches tab first, then scrolls once
  // the new body has been committed.
  const scrollToPlans = useScrollToPlans();

  if (!entitlements) {
    return (
      <div className="border border-borderColor rounded-lg p-3 sm:p-4 bg-white dark:bg-darkPrimaryBg dark:border-darkBorder">
        <h3 className="text-lg font-medium text-headingTextColor dark:text-darkTextPrimary mb-1">
          Current plan
        </h3>
        <p className="text-sm text-subTextColor dark:text-darkTextSecondary mb-4">
          No subscription — choose a plan below
        </p>
        <Button onClick={scrollToPlans}>View plans</Button>
      </div>
    );
  }

  const trialDays = daysUntil(entitlements.trial_ends_at, now);
  const description =
    plans.find((p) => p.id === entitlements.plan_id)?.description ?? null;

  return (
    <div className="w-full border border-borderColor rounded-lg p-3 sm:p-4 lg:flex lg:items-center bg-white dark:bg-darkPrimaryBg dark:border-darkBorder">
      <div className="min-w-[450px] flex flex-col gap-4 pr-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-subTextColor dark:text-darkTextSecondary mb-1">
            Current plan
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-xl font-medium ?text-headingTextColor dark:text-darkTextPrimary">
              {entitlements.plan_name ?? "—"}
            </h3>
            {entitlements.tier && (
              <span className="inline-flex items-center rounded-full bg-primary/10  border border-primary/20 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                {entitlements.tier}
              </span>
            )}
            <BillingStatusChip status={entitlements.status} />
          </div>

          {description && (
            <p className="mb-2 text-sm text-subTextColor dark:text-darkTextSecondary">
              {description}
            </p>
          )}

          <div className="space-y-2 text-sm text-subTextColor dark:text-darkTextSecondary">
            {entitlements.billing_cycle && (
              <p className="flex items-center gap-1.5">
                <BillingIcon size={28} className="bg-[#f3f5fa] dark:bg-[#ececec15] p-1 rounded" />
                Billed {entitlements.billing_cycle}
              </p>
            )}
            {entitlements.status === "active" &&
              entitlements.current_period_end && (
                <p className="flex items-center gap-1.5">
                  <TrailCalenderIcon size={28} className="bg-[#f3f5fa] dark:bg-[#ececec15] p-1 rounded" />
                  Renews {formatBillingDate(entitlements.current_period_end, timeZone)}
                </p>
              )}
            {entitlements.status === "trialing" && (
              <p className="flex items-center gap-1.5">
                <TrailCalenderIcon size={28} className="bg-[#f3f5fa] dark:bg-[#ececec15] p-1 rounded" />
                {/* An expired trial keeps status "trialing" until the worker
                    resolves it — future tense next to the red "trial has
                    ended" surfaces would contradict them. */}
                {isDatePast(entitlements.trial_ends_at, now)
                  ? `Trial ended ${formatBillingDate(entitlements.trial_ends_at, timeZone)}`
                  : `Trial ends ${formatBillingDate(entitlements.trial_ends_at, timeZone)} (${trialDays} day${trialDays === 1 ? "" : "s"})`}
              </p>
            )}
            {entitlements.status === "canceled" &&
              entitlements.current_period_end && (
                <p className="flex items-center gap-1.5">
                  <TrailCalenderIcon size={28} className="bg-[#f3f5fa] dark:bg-[#ececec15] p-1 rounded" />
                  {isDatePast(entitlements.current_period_end, now)
                    ? `Ended ${formatBillingDate(entitlements.current_period_end, timeZone)}`
                    : `Access until ${formatBillingDate(entitlements.current_period_end, timeZone)}`}
                </p>
              )}
          </div>

          {entitlements.pending_downgrade_plan_id !== null && (
            <p className="mt-3 rounded-md bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-280">
              A downgrade is scheduled to apply at your renewal.
            </p>
          )}

          {entitlements.last_payment_failure_reason && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">
              Last payment failure: {entitlements.last_payment_failure_reason}
            </p>
          )}
        </div>

        {isAdmin && entitlements.status === "active" && (
          <div className="shrink-0 ">
            <CancelSubscriptionDialog />
          </div>
        )}

        {/* Canceled companies re-buy through checkout — the pricing grid below
            carries the actual CTA, so this one just brings it into view. */}
        {isAdmin && entitlements.status === "canceled" && (
          <div className="shrink-0">
            <Button onClick={scrollToPlans}>Reactivate plan</Button>
          </div>
        )}
      </div>

      <SeatUsageCard
        activeUserCount={activeUserCount}
        entitlements={entitlements}
        isAdmin={isAdmin}
      />
    </div>
  );
}
