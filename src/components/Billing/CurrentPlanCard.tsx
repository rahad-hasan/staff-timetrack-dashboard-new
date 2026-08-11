"use client";

import { CalendarDays, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { daysUntil, formatBillingDate } from "@/lib/billing";
import { useBillingStore } from "@/store/billingStore";
import { useLogInUserStore } from "@/store/logInUserStore";
import BillingStatusChip from "./BillingStatusChip";
import CancelSubscriptionDialog from "./CancelSubscriptionDialog";

/**
 * Billing page hero card — current plan, cycle, renewal/trial dates, pending
 * downgrade note and (admin + active only) the cancel-subscription entry point.
 */
export default function CurrentPlanCard() {
  const entitlements = useBillingStore((s) => s.status?.entitlements ?? null);
  const role = useLogInUserStore((s) => s.logInUserData?.role);
  const isAdmin = role === "admin";

  const scrollToPlans = () => {
    document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });
  };

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

  const trialDays = daysUntil(entitlements.trial_ends_at);

  return (
    <div className="border border-borderColor rounded-lg p-3 sm:p-4 bg-white dark:bg-darkPrimaryBg dark:border-darkBorder">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-subTextColor dark:text-darkTextSecondary mb-1">
            Current plan
          </p>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-xl font-medium text-headingTextColor dark:text-darkTextPrimary">
              {entitlements.plan_name ?? "—"}
            </h3>
            {entitlements.tier && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                {entitlements.tier}
              </span>
            )}
            <BillingStatusChip status={entitlements.status} />
          </div>

          <div className="space-y-1 text-sm text-subTextColor dark:text-darkTextSecondary">
            {entitlements.billing_cycle && (
              <p className="flex items-center gap-1.5">
                <RefreshCcw className="h-4 w-4 shrink-0" />
                Billed {entitlements.billing_cycle}
              </p>
            )}
            {entitlements.status === "active" &&
              entitlements.current_period_end && (
                <p className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  Renews {formatBillingDate(entitlements.current_period_end)}
                </p>
              )}
            {entitlements.status === "trialing" && (
              <p className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 shrink-0" />
                Trial ends {formatBillingDate(entitlements.trial_ends_at)} (
                {trialDays} day{trialDays === 1 ? "" : "s"})
              </p>
            )}
          </div>

          {entitlements.pending_downgrade_plan_id !== null && (
            <p className="mt-3 rounded-md bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
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
          <div className="shrink-0">
            <CancelSubscriptionDialog />
          </div>
        )}
      </div>
    </div>
  );
}
