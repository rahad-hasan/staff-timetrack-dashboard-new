"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { IBillingBlock } from "@/types/billing";
import { BILLING_URL, BLOCK_CODE_COPY } from "@/lib/billing";
import { Button } from "@/components/ui/button";
import { useLogInUserStore } from "@/store/logInUserStore";
import TrialEndedOptions from "./TrialEndedOptions";

/**
 * Full-screen opaque takeover for hard billing blocks (contract §4, guide §1):
 * TRIAL_EXPIRED, SUBSCRIPTION_CANCELED, SUBSCRIPTION_REQUIRED,
 * SUBSCRIPTION_EXPIRED, COMPANY_DEACTIVATED. Friendly copy per block code
 * (fallback to the backend message), backend message as detail line, and a
 * "Go to billing" CTA — replaced by "Ask your company admin…" for roles that
 * cannot manage billing.
 *
 * TRIAL_EXPIRED for an admin gets the richer two-option resolution instead:
 * upgrade (keep everything) or switch to the Free plan right now
 * (TrialEndedOptions) — no waiting for the expiry worker.
 */
export default function BlockedTakeover({ block }: { block: IBillingBlock }) {
  const role = useLogInUserStore((s) => s.logInUserData?.role);
  const normalizedRole = String(role ?? "").toLowerCase();
  const canManageBilling = ["admin", "manager", "hr"].includes(normalizedRole);
  const showTrialOptions =
    block.code === "TRIAL_EXPIRED" && normalizedRole === "admin";

  const copy = BLOCK_CODE_COPY[block.code] as
    | { title: string; description: string }
    | undefined;
  const title = copy?.title ?? block.message;
  const description = copy?.description ?? block.message;
  const showDetail =
    !!block.message && block.message !== description && block.message !== title;

  return (
    // `m-auto` (not items-center) centers the card: with items-center a card
    // taller than the viewport overflows symmetrically and its top becomes
    // unreachable — which the expanded "Switch to Free" confirm panel hits on
    // short screens.
    <div className="fixed inset-0 z-[100] flex overflow-y-auto bg-gray-50 p-4 dark:bg-darkPrimaryBg">
      <div
        className={`m-auto w-full ${showTrialOptions ? "max-w-lg" : "max-w-md"} rounded-lg border border-borderColor bg-white p-6 text-center shadow-lg sm:p-8 dark:border-darkBorder dark:bg-darkSecondaryBg`}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/15">
          <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-300" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
          {title}
        </h2>
        <p className="mb-3 text-sm text-subTextColor dark:text-darkTextSecondary">
          {description}
        </p>
        {showDetail && (
          <p className="mb-4 text-xs text-subTextColor dark:text-darkTextSecondary">
            {block.message}
          </p>
        )}
        {showTrialOptions ? (
          <div className="mt-2">
            <TrialEndedOptions
              upgradeHref={block.webBillingUrl || BILLING_URL}
            ></TrialEndedOptions>
          </div>
        ) : canManageBilling ? (
          <Button asChild className="mt-2">
            <Link href={block.webBillingUrl || BILLING_URL}>Go to billing</Link>
          </Button>
        ) : (
          <p className="mt-2 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
            Ask your company admin to update billing.
          </p>
        )}
      </div>
    </div>
  );
}
