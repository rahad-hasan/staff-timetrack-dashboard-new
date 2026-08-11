"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
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
import { createCheckoutSession } from "@/actions/billing/action";
import { BillingCycle, IBillingPlan, ICheckoutSession } from "@/types/billing";

/**
 * First purchase (guide §2) — collects seats + optional promo code, creates a
 * Stripe-hosted checkout session and redirects to it. If the backend flags
 * `trialWillEndImmediately`, an interstitial warning is shown INSIDE the
 * dialog before the redirect.
 */
export default function CheckoutDialog({
  plan,
  cycle,
  activeUserCount,
  open,
  onOpenChange,
}: {
  plan: IBillingPlan | null;
  cycle: BillingCycle;
  activeUserCount: number;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const minSeats = Math.max(1, activeUserCount);

  const [seats, setSeats] = useState<string>(String(minSeats));
  const [promo, setPromo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  /** Set when the session is created but the trial-ends-now warning must be acknowledged first. */
  const [session, setSession] = useState<ICheckoutSession | null>(null);

  // Reset the form every time the dialog (re)opens.
  useEffect(() => {
    if (open) {
      setSeats(String(Math.max(1, activeUserCount)));
      setPromo("");
      setError(null);
      setSession(null);
      setSubmitting(false);
    }
  }, [open, activeUserCount, plan?.id]);

  if (!plan) return null;

  const cycleLabel = cycle === "monthly" ? "Monthly" : "Yearly";

  const handleSubmit = async () => {
    const parsed = Number.parseInt(seats, 10);
    if (!Number.isFinite(parsed) || parsed < minSeats) {
      setError(
        `Seats must be at least ${minSeats} — you have ${activeUserCount} active members.`,
      );
      return;
    }

    setError(null);
    setSubmitting(true);
    let redirecting = false;
    try {
      const res = await createCheckoutSession({
        plan_id: plan.id,
        seats: parsed,
        cycle,
        ...(promo.trim() ? { discount_code: promo.trim() } : {}),
      });

      if (res?.success && res.data) {
        if (res.data.trialWillEndImmediately) {
          setSession(res.data);
        } else {
          redirecting = true;
          window.location.assign(res.data.checkoutUrl);
        }
      } else {
        const msg =
          res?.message || "Could not start checkout. Please try again.";
        const hint = /already exists/i.test(msg)
          ? " Use 'Switch to this plan' on the pricing cards instead."
          : "";
        setError(msg + hint);
      }
    } catch {
      toast.error("Something went wrong starting checkout. Please try again.");
    } finally {
      if (!redirecting) setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-headingTextColor dark:text-darkTextPrimary">
            Get started — {plan.name}
          </DialogTitle>
          <DialogDescription className="text-subTextColor dark:text-darkTextSecondary">
            {cycleLabel} billing. You&apos;ll complete payment on Stripe&apos;s
            secure checkout page.
          </DialogDescription>
        </DialogHeader>

        {session ? (
          <>
            <div className="rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Your trial ends now and paid billing starts immediately.
                  </p>
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-300/80">
                    Continue to Stripe&apos;s secure checkout to complete your
                    purchase, or go back to review your selection.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline2"
                onClick={() => setSession(null)}
              >
                Go back
              </Button>
              <Button
                type="button"
                onClick={() => window.location.assign(session.checkoutUrl)}
              >
                Continue to payment
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="checkout-seats"
                  className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary"
                >
                  Seats
                </label>
                <Input
                  id="checkout-seats"
                  type="number"
                  min={minSeats}
                  step={1}
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                  disabled={submitting}
                />
                <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                  You have {activeUserCount} active members — seats can&apos;t
                  go below that.
                </p>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="checkout-promo"
                  className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary"
                >
                  Promo code{" "}
                  <span className="font-normal text-subTextColor dark:text-darkTextSecondary">
                    (optional)
                  </span>
                </label>
                <Input
                  id="checkout-promo"
                  value={promo}
                  onChange={(e) => setPromo(e.target.value)}
                  placeholder="e.g. WELCOME20"
                  disabled={submitting}
                />
                <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                  Percentage codes apply to your entire first billing cycle,
                  including prorated seat additions. Fixed-amount codes apply to
                  the first invoice only. Renewals are full price.
                </p>
              </div>

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
              <Button type="button" onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Continue to checkout
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
