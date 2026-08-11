"use client";

import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import {
  BILLING_URL,
  daysUntil,
  formatBillingDate,
  isDatePast,
} from "@/lib/billing";

/**
 * Slim full-width trial banner (contract §2, guide §1/§6). Blue countdown
 * while the trial is running; red "Your trial has ended" variant once
 * `trial_ends_at` has passed (the backend worker blocks within the hour).
 * Renders nothing when `trialEndsAt` is null.
 */
export default function TrialBanner({
  trialEndsAt,
}: {
  trialEndsAt: string | null;
}) {
  if (!trialEndsAt) return null;

  if (isDatePast(trialEndsAt)) {
    return (
      <div className="w-full border-b border-red-200 bg-red-50 px-4 py-2.5 dark:border-red-500/30 dark:bg-red-500/15">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-sm text-red-800 dark:text-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-medium">Your trial has ended</span>
          <span className="hidden text-red-700/80 sm:inline dark:text-red-200/80">
            Ended {formatBillingDate(trialEndsAt)} — choose a plan to keep your
            team tracking.
          </span>
          <Link
            href={BILLING_URL}
            className="inline-flex items-center rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700"
          >
            Choose a plan
          </Link>
        </div>
      </div>
    );
  }

  const days = daysUntil(trialEndsAt);

  return (
    <div className="w-full border-b border-blue-200 bg-blue-50 px-4 py-2.5 dark:border-blue-500/30 dark:bg-blue-500/15">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-sm text-blue-800 dark:text-blue-200">
        <Clock className="h-4 w-4 shrink-0" />
        <span className="font-medium">
          Free trial — {days} day{days === 1 ? "" : "s"} left
        </span>
        <span className="hidden text-blue-700/80 sm:inline dark:text-blue-200/80">
          Ends {formatBillingDate(trialEndsAt)}
        </span>
        <Link
          href={BILLING_URL}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
        >
          Choose a plan
        </Link>
      </div>
    </div>
  );
}
