"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowUpRight, Loader2, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPlans, switchToFreePlan } from "@/actions/billing/action";
import { isFreePlan } from "@/lib/billing";
import { useBillingStore } from "@/store/billingStore";
import { IBillingPlan } from "@/types/billing";

/**
 * Two-option resolution for an ended trial (admin only — parents gate on
 * role): upgrade and keep everything, or switch to the Free plan now instead
 * of waiting for the expiry worker.
 *
 * The Free path shows the Free plan's real limits (public plans list) before
 * committing. On confirm, `POST /downgrade/switch-to-free` either applies the
 * plan instantly (fits limits) or flips the status to
 * pending_downgrade_selection — the refetched status makes BillingGate /
 * BillingPageClient swap in the DowngradeWizard, so the selection flow
 * continues seamlessly with no extra wiring here.
 *
 * `upgradeHref` renders the upgrade CTA as a Link (used inside the global
 * takeover); omit it on the billing page itself to scroll to the #plans grid.
 */
export default function TrialEndedOptions({
  upgradeHref,
}: {
  upgradeHref?: string;
}) {
  const fetchStatus = useBillingStore((s) => s.fetchStatus);

  const [confirming, setConfirming] = useState(false);
  const [freePlan, setFreePlan] = useState<IBillingPlan | null>(null);
  const [planLoaded, setPlanLoaded] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShowConfirm = async () => {
    setError(null);
    setConfirming(true);
    if (planLoaded || loadingPlan) return;
    setLoadingPlan(true);
    try {
      const res = await getPlans();
      if (res?.success && Array.isArray(res.data)) {
        setFreePlan(res.data.find(isFreePlan) ?? null);
      }
    } catch {
      // Limits display is best-effort — the confirm copy covers the generic case.
    } finally {
      setPlanLoaded(true);
      setLoadingPlan(false);
    }
  };

  const handleSwitch = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await switchToFreePlan();
      if (res?.success && res.data) {
        if (res.data.outcome === "downgraded") {
          toast.success(`You're on the ${res.data.plan.name} plan now.`);
        } else {
          toast.info(
            "Your workspace exceeds the Free plan limits — choose which members and projects stay active.",
          );
        }
        // The refetched status drives everything: the blocked screen clears
        // (downgraded) or the DowngradeWizard takes over (selection_required).
        await fetchStatus();
      } else {
        setError(
          res?.message || "Could not switch to the Free plan. Please try again.",
        );
        // Covers the race where a payment webhook changed the status meanwhile.
        void fetchStatus();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const limits = freePlan?.limits;
  const limitLabel = (value: number | undefined): string =>
    value === undefined ? "—" : value === -1 ? "Unlimited" : String(value);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        {upgradeHref ? (
          <Button asChild className="sm:min-w-44">
            <Link href={upgradeHref}>
              Upgrade — keep everything
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            className="sm:min-w-44"
            onClick={() =>
              document
                .getElementById("plans")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Upgrade — keep everything
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="outline2"
          className="sm:min-w-44"
          onClick={() => void handleShowConfirm()}
          disabled={submitting}
        >
          <PackageOpen className="h-4 w-4" />
          Switch to Free plan
        </Button>
      </div>

      {confirming && (
        <div className="mt-4 rounded-lg border border-borderColor bg-bgSecondary p-4 text-left dark:border-darkBorder dark:bg-darkSecondaryBg">
          {loadingPlan ? (
            <div className="flex items-center gap-2 py-2 text-sm text-subTextColor dark:text-darkTextSecondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading Free plan details…
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                {freePlan
                  ? `The ${freePlan.name} plan includes up to ${limitLabel(
                      limits?.max_seats,
                    )} members and ${limitLabel(
                      limits?.max_projects,
                    )} active projects.`
                  : "The Free plan has limits on members and active projects."}
              </p>
              <p className="mt-1.5 text-sm text-subTextColor dark:text-darkTextSecondary">
                If your workspace currently exceeds these limits, you&apos;ll
                choose which members and projects stay active in the next step.
                Nothing is deleted — parked members and archived projects can be
                restored anytime by upgrading.
              </p>
              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              )}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => void handleSwitch()}
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Yes, switch to Free
                </Button>
                <Button
                  type="button"
                  variant="outline2"
                  onClick={() => setConfirming(false)}
                  disabled={submitting}
                >
                  Go back
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
