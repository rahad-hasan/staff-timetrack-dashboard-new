"use client";

import { Infinity as InfinityIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getSeatUsage, hasPaidSubscription } from "@/lib/billing";
import { useBillingStore } from "@/store/billingStore";
import { useLogInUserStore } from "@/store/logInUserStore";

/**
 * "Seats" card (guide §3). Purchased seats + effective cap come from
 * `getSeatUsage(entitlements)`; the active-user count comes from the members
 * list via props. "Add seats" is admin-only AND requires a paid subscription
 * (otherwise seats come from checkout / the plan instead).
 */
export default function SeatUsageCard({
  activeUserCount,
}: {
  activeUserCount: number;
}) {
  const entitlements = useBillingStore((s) => s.status?.entitlements ?? null);
  const openAddSeats = useBillingStore((s) => s.openAddSeats);
  const role = useLogInUserStore((s) => s.logInUserData?.role);

  const usage = getSeatUsage(entitlements);
  const isAdmin = role === "admin";
  const showAddSeats = isAdmin && hasPaidSubscription(entitlements);

  const cap = usage.cap;
  const isFull = !usage.unlimited && cap !== null && activeUserCount >= cap;
  const percent =
    !usage.unlimited && cap !== null && cap > 0
      ? Math.min(100, (activeUserCount / cap) * 100)
      : 0;

  return (
    <div className="border border-borderColor rounded-lg p-3 sm:p-4 bg-white dark:bg-darkPrimaryBg dark:border-darkBorder">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">
          Seats
        </h3>
        {showAddSeats && (
          <Button type="button" size="sm" onClick={openAddSeats}>
            <Plus />
            Add seats
          </Button>
        )}
      </div>

      {usage.unlimited ? (
        <div className="mt-4 flex items-center gap-2">
          <InfinityIcon className="h-6 w-6 text-primary" />
          <span className="text-base font-medium text-headingTextColor dark:text-darkTextPrimary">
            Unlimited seats
          </span>
        </div>
      ) : (
        <div className="mt-4">
          <p
            className={cn(
              "text-sm font-medium",
              isFull
                ? "text-red-600 dark:text-red-400"
                : "text-headingTextColor dark:text-darkTextPrimary",
            )}
          >
            {activeUserCount} of {cap} seats used
          </p>
          <div className="mt-2 h-2 w-full rounded-full bg-bgSecondary dark:bg-darkSecondaryBg">
            <div
              className={cn(
                "h-2 rounded-full transition-all",
                isFull ? "bg-red-500" : "bg-primary",
              )}
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-subTextColor dark:text-darkTextSecondary">
            Purchased: {usage.purchased ?? "Unlimited"}
          </p>
        </div>
      )}
    </div>
  );
}
