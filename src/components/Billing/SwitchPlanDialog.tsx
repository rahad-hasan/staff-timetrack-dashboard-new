"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { switchPlan } from "@/actions/billing/action";
import { useBillingStore } from "@/store/billingStore";
import {
  BillingCycle,
  CYCLE_LABEL,
  IBillingPlan,
  ISwitchPlanResult,
} from "@/types/billing";
import PendingInvoiceNotice from "./PendingInvoiceNotice";
import RestoreParkedDialog from "./RestoreParkedDialog";
import { useBillingRefresh } from "./useBillingRefresh";

const cycleLabel = (c: BillingCycle | null | undefined): string =>
  c ? (CYCLE_LABEL[c] ?? "—") : "—";

/**
 * Prorated plan switch (guide §5). Seats override is optional — blank keeps
 * the current quantity. Changing cycle restarts the billing cycle from today
 * (amber warning). `applied_now: false` keeps the dialog open with
 * the pending-invoice notice; `applied_now: true` closes it and offers the
 * parked-users restore dialog.
 */
export default function SwitchPlanDialog({
  plan,
  cycle,
  open,
  onOpenChange,
}: {
  plan: IBillingPlan | null;
  cycle: BillingCycle;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const entitlements = useBillingStore((s) => s.status?.entitlements ?? null);
  const refreshBilling = useBillingRefresh();
  const startPolling = useBillingStore((s) => s.startPolling);
  const stopPolling = useBillingStore((s) => s.stopPolling);

  const [seatsInput, setSeatsInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** Set when the switch succeeded but is pending invoice payment (`applied_now: false`). */
  const [pending, setPending] = useState<ISwitchPlanResult | null>(null);
  /** Restore-parked offer, shown AFTER a successful applied-now switch. */
  const [restoreOpen, setRestoreOpen] = useState(false);

  // Reset the form every time the dialog (re)opens.
  useEffect(() => {
    if (open) {
      setSeatsInput("");
      setError(null);
      setPending(null);
      setSubmitting(false);
    }
  }, [open, plan?.id]);

  /* While the pending-invoice notice is shown, poll billing/status every 5s —
     the switch applies via webhook once the proration invoice is paid
     (guide §5: same confirm-payment handling as add-seats §3). */
  useEffect(() => {
    if (open && pending) {
      startPolling(5000);
      return () => stopPolling();
    }
    return undefined;
  }, [open, pending, startPolling, stopPolling]);

  /* When the polled status shows the target plan+cycle live, celebrate,
     close, and offer the parked-users restore. */
  useEffect(() => {
    if (!open || !pending?.switched_to || !entitlements) return;
    const target = pending.switched_to;
    if (
      entitlements.plan_id === target.plan_id &&
      entitlements.billing_cycle === target.cycle
    ) {
      toast.success(`Switched to ${target.plan_name} ✓`);
      onOpenChange(false);
      setRestoreOpen(true);
    }
  }, [open, pending, entitlements, onOpenChange]);

  if (!plan) {
    return (
      <RestoreParkedDialog open={restoreOpen} onOpenChange={setRestoreOpen} />
    );
  }

  const currentSeats = entitlements?.seat_limit ?? -1;
  const seatsPlaceholder =
    currentSeats > 0 ? `Keep current (${currentSeats})` : "Keep current";
  const cycleChanges =
    !!entitlements?.billing_cycle && entitlements.billing_cycle !== cycle;

  const handleConfirm = async () => {
    let seats: number | undefined;
    const trimmed = seatsInput.trim();
    if (trimmed) {
      const parsed = Number.parseInt(trimmed, 10);
      if (!Number.isFinite(parsed) || parsed < 1) {
        setError("Seats must be a whole number of at least 1.");
        return;
      }
      seats = parsed;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await switchPlan({
        planId: plan.id,
        ...(seats !== undefined ? { seats } : {}),
        cycle,
      });

      if (res?.success && res.data) {
        if (res.data.applied_now) {
          toast.success(
            `Switched to ${res.data.switched_to?.plan_name ?? plan.name} ✓`,
          );
          await refreshBilling();
          onOpenChange(false);
          setRestoreOpen(true);
        } else {
          setPending(res.data);
          void refreshBilling();
        }
      } else {
        setError(res?.message || "Could not switch plans. Please try again.");
      }
    } catch {
      toast.error("Something went wrong switching plans. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-headingTextColor dark:text-darkTextPrimary">
              Switch to {plan.name}
            </DialogTitle>
            <DialogDescription className="text-subTextColor dark:text-darkTextSecondary">
              Your plan change is prorated by Stripe — you only ever pay for
              what you use.
            </DialogDescription>
          </DialogHeader>

          {pending ? (
            <>
              <PendingInvoiceNotice
                result={pending}
                message="Plan switch pending payment. Settle the proration invoice to apply the change."
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline2"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="rounded-md border border-borderColor bg-bgSecondary p-3 dark:border-darkBorder dark:bg-darkSecondaryBg">
                  <div className="flex items-center justify-center gap-3 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                        {entitlements?.plan_name ?? "Current plan"}
                      </p>
                      <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                        {cycleLabel(entitlements?.billing_cycle)}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-subTextColor dark:text-darkTextSecondary" />
                    <div className="text-center">
                      <p className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                        {plan.name}
                      </p>
                      <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                        {cycleLabel(cycle)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="switch-seats"
                    className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary"
                  >
                    Seats{" "}
                    <span className="font-normal text-subTextColor dark:text-darkTextSecondary">
                      (optional)
                    </span>
                  </label>
                  <Input
                    id="switch-seats"
                    type="number"
                    min={1}
                    step={1}
                    placeholder={seatsPlaceholder}
                    value={seatsInput}
                    onChange={(e) => setSeatsInput(e.target.value)}
                    disabled={submitting}
                  />
                  <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                    Leave blank to keep your current seat count.
                  </p>
                </div>

                {cycleChanges && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-500/40 dark:bg-amber-500/10">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      Switching between monthly and yearly restarts your billing
                      cycle from today.
                    </p>
                  </div>
                )}

                <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                  Upgrades charge the prorated difference for the remaining
                  period now; downgrades credit the unused difference.
                </p>

                {error && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                    {error}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline2"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirm}
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm switch
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <RestoreParkedDialog open={restoreOpen} onOpenChange={setRestoreOpen} />
    </>
  );
}
