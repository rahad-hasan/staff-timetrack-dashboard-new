"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IDowngradePreview } from "@/types/billing";
import { getDowngradePreview } from "@/actions/billing/action";
import { BILLING_URL } from "@/lib/billing";
import { useLogInUserStore } from "@/store/logInUserStore";
import DowngradeWizard from "./DowngradeWizard";
import { useBillingRefresh } from "./useBillingRefresh";

/**
 * Owner selection surface for `status === "pending_downgrade_selection"`
 * (guide §6): the trial ended over the Free plan's limits, so the owner must
 * choose what stays active.
 *
 * `variant="overlay"` (default) is the full-screen takeover BillingGate
 * mounts everywhere except the billing pages (which stay reachable for the
 * "upgrade instead" path). `variant="inline"` renders the same flow as a page
 * section — BillingPageClient uses it so the selection is resolvable on
 * /settings/billing too, with the pricing grid right below as the upgrade
 * alternative (the CTA scrolls to #plans instead of navigating).
 */
export default function DowngradeTakeover({
  variant = "overlay",
}: {
  variant?: "overlay" | "inline";
}) {
  const refreshBilling = useBillingRefresh();
  const { logInUserData } = useLogInUserStore();
  const role = logInUserData?.role as string | undefined;
  const isAdmin = role === "admin";
  const canSeeBilling = role === "admin" || role === "manager" || role === "hr";

  const [preview, setPreview] = useState<IDowngradePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getDowngradePreview();
      if (res?.success && res.data) {
        setPreview(res.data);
      } else {
        setError(res?.message || "Could not load your downgrade options.");
      }
    } catch {
      setError("Something went wrong while loading your downgrade options.");
      toast.error("Something went wrong while loading your downgrade options.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The preview + resolve endpoints are admin-only surfaces.
    if (isAdmin) void loadPreview();
  }, [isAdmin, loadPreview]);

  const handleResolved = useCallback(() => {
    toast.success("All set — your workspace now matches your plan.");
    void (async () => {
      try {
        await refreshBilling();
      } catch {
        // non-fatal: the next status poll/refetch will pick the change up
      }
    })();
  }, [refreshBilling]);

  const isInline = variant === "inline";

  const content = (
    <>
        <div className="mb-6 text-center">
          <h1
            className={`font-semibold text-headingTextColor dark:text-darkTextPrimary ${isInline ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl"}`}
          >
            Your trial ended — choose what stays active
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-subTextColor dark:text-darkTextSecondary sm:text-base">
            Your team is over the free plan&apos;s limits, so pick which members
            and projects stay active. Everything else is parked — not deleted —
            and can be restored after an upgrade.
          </p>
        </div>

        {canSeeBilling && (
          <div className="mb-6 flex justify-center">
            {isInline ? (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  document
                    .getElementById("plans")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Keep everyone — upgrade instead
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href={BILLING_URL}>
                  Keep everyone — upgrade instead
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        )}

        {!isAdmin ? (
          <div className="border border-borderColor rounded-lg p-3 sm:p-4 bg-white dark:bg-darkPrimaryBg dark:border-darkBorder text-center">
            <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
              Ask your company admin to choose which members and projects stay
              active.
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-borderColor bg-white py-16 text-subTextColor dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextSecondary">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Loading your downgrade options…</span>
          </div>
        ) : error ? (
          <div className="border border-borderColor rounded-lg p-3 sm:p-4 bg-white dark:bg-darkPrimaryBg dark:border-darkBorder">
            <p className="mb-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
            <Button
              type="button"
              variant="outline2"
              onClick={() => void loadPreview()}
            >
              Try again
            </Button>
          </div>
        ) : preview ? (
          <DowngradeWizard preview={preview} onResolved={handleResolved} />
        ) : null}
    </>
  );

  if (isInline) {
    return <div className="w-full">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-bgSecondary dark:bg-darkSecondaryBg">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        {content}
      </div>
    </div>
  );
}
