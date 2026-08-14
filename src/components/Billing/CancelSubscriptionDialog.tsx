"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatBillingDate } from "@/lib/billing";
import { cancelSubscription } from "@/actions/billing/action";
import { useBillingStore } from "@/store/billingStore";
import { useBillingRefresh } from "./useBillingRefresh";

const REASON_OPTIONS = [
  "Too expensive",
  "Missing features",
  "Switching to another tool",
  "No longer needed",
  "Other",
];

/**
 * Cancel subscription (guide §7). Period-end cancellation is the default —
 * service continues until `current_period_end`. Immediate cancellation stops
 * tracking for the whole team right away and requires typing CANCEL exactly.
 * Renders its own quiet destructive-outline trigger button.
 */
export default function CancelSubscriptionDialog() {
  const currentPeriodEnd = useBillingStore(
    (s) => s.status?.entitlements?.current_period_end ?? null,
  );
  const refreshBilling = useBillingRefresh();

  const [open, setOpen] = useState(false);
  const [atPeriodEnd, setAtPeriodEnd] = useState(true);
  const [confirmText, setConfirmText] = useState("");
  const [reasonChoice, setReasonChoice] = useState<string>("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setAtPeriodEnd(true);
    setConfirmText("");
    setReasonChoice("");
    setReasonDetail("");
    setSubmitting(false);
    setError(null);
  };

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) resetState();
  };

  const immediateConfirmed = confirmText === "CANCEL";
  const canSubmit = !submitting && (atPeriodEnd || immediateConfirmed);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    // Dropdown choice + free text combined, hard-capped at the backend's 300 chars.
    const reason = [reasonChoice, reasonDetail.trim()]
      .filter(Boolean)
      .join(" — ")
      .slice(0, 300);
    try {
      const res = await cancelSubscription({
        at_period_end: atPeriodEnd,
        ...(reason ? { reason } : {}),
      });
      if (res?.success) {
        toast.success(res.message || "Subscription cancellation requested");
        await refreshBilling();
        handleOpenChange(false);
      } else {
        setError(res?.message || "Could not cancel the subscription.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-300"
        >
          Cancel subscription
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-headingTextColor dark:text-darkTextPrimary">
            Cancel subscription
          </DialogTitle>
          <DialogDescription className="text-subTextColor dark:text-darkTextSecondary">
            Choose how you&apos;d like to cancel. You can purchase a plan again
            at any time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
              atPeriodEnd
                ? "border-primary bg-primary/5"
                : "border-borderColor dark:border-darkBorder",
            )}
          >
            <input
              type="radio"
              name="cancel-mode"
              checked={atPeriodEnd}
              onChange={() => setAtPeriodEnd(true)}
              className="mt-1 accent-primary"
            />
            <span>
              <span className="block text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                Cancel at period end
              </span>
              <span className="block text-sm text-subTextColor dark:text-darkTextSecondary">
                Your plan stays active until{" "}
                {formatBillingDate(currentPeriodEnd)}. No further charges.
              </span>
            </span>
          </label>

          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
              !atPeriodEnd
                ? "border-red-400 bg-red-50/50 dark:border-red-500/50 dark:bg-red-500/5"
                : "border-borderColor dark:border-darkBorder",
            )}
          >
            <input
              type="radio"
              name="cancel-mode"
              checked={!atPeriodEnd}
              onChange={() => setAtPeriodEnd(false)}
              className="mt-1 accent-red-600"
            />
            <span>
              <span className="block text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                Cancel immediately
              </span>
              <span className="block text-sm text-subTextColor dark:text-darkTextSecondary">
                Tracking stops for your whole team right away.
              </span>
            </span>
          </label>

          {!atPeriodEnd && (
            <div className="space-y-1.5">
              <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                Type <span className="font-semibold">CANCEL</span> to confirm
                immediate cancellation:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="CANCEL"
                autoComplete="off"
              />
            </div>
          )}

          <div className="space-y-1.5 pt-1">
            <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
              Why are you canceling? (optional)
            </p>
            <Select value={reasonChoice} onValueChange={setReasonChoice}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value.slice(0, 300))}
              placeholder="Anything else you'd like to share? (optional)"
              maxLength={300}
              className="min-h-20"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline2"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Keep subscription
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {atPeriodEnd ? "Cancel at period end" : "Cancel immediately"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
