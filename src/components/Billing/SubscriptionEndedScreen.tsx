"use client";

import { CircleOff } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Inline section (NOT an overlay) for the billing page when the subscription
 * status is "canceled". Data is intact; checkout is available again (guide §1/§7).
 */
export default function SubscriptionEndedScreen() {
  const scrollToPlans = () => {
    document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="border border-borderColor rounded-lg p-3 sm:p-4 bg-white dark:bg-darkPrimaryBg dark:border-darkBorder">
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="rounded-full bg-gray-100 dark:bg-gray-500/15 p-3">
          <CircleOff className="h-6 w-6 text-gray-500 dark:text-gray-300" />
        </div>
        <h2 className="text-xl font-medium text-headingTextColor dark:text-darkTextPrimary">
          Subscription ended
        </h2>
        <p className="max-w-md text-sm text-subTextColor dark:text-darkTextSecondary">
          Your data is intact. Choose a plan below to reactivate — checkout is
          available again.
        </p>
        <Button onClick={scrollToPlans}>Choose a plan</Button>
      </div>
    </div>
  );
}
