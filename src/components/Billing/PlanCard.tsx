"use client";

import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDollars, isFreePlan } from "@/lib/billing";
import { BillingCycle, IBillingPlan } from "@/types/billing";

/**
 * One pricing card (guide §2). Prices are display dollars; the discount price
 * replaces the base price (base struck through) ONLY when it is non-null.
 * CTA: current plan → disabled; paid subscription → switch; else checkout.
 * The Free/default plan is never checkout-able — it is applied via downgrade
 * (trial-end "Switch to Free" or cancellation), so its CTA is a caption.
 * Non-admins never see a mutating CTA.
 */
export default function PlanCard({
  plan,
  cycle,
  isCurrent,
  hasPaid,
  isAdmin,
  onCheckout,
  onSwitch,
}: {
  plan: IBillingPlan;
  cycle: BillingCycle;
  isCurrent: boolean;
  hasPaid: boolean;
  isAdmin: boolean;
  onCheckout: () => void;
  onSwitch: () => void;
}) {
  const basePrice = cycle === "monthly" ? plan.monthly_price : plan.yearly_price;
  const discountPrice =
    cycle === "monthly" ? plan.monthly_discount_price : plan.yearly_discount_price;
  const seatPrice =
    cycle === "monthly" ? plan.seat_price_monthly : plan.seat_price_yearly;

  const hasDiscount = discountPrice !== null && discountPrice !== undefined;
  const displayPrice = hasDiscount ? discountPrice : basePrice;
  const periodLabel = cycle === "monthly" ? "per month" : "per year";
  const perSeatUnit = cycle === "monthly" ? "mo" : "yr";

  return (
    <div
      className={cn(
        "relative flex flex-col border border-borderColor rounded-lg p-5 sm:p-6 bg-white dark:bg-darkPrimaryBg dark:border-darkBorder",
        isCurrent && "border-primary ring-1 ring-primary",
      )}
    >
      {plan.badge_text && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
          {plan.badge_text}
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="text-xl font-medium text-headingTextColor dark:text-darkTextPrimary">
          {plan.name}
        </h3>
        {typeof plan.discount_percentage === "number" &&
          plan.discount_percentage > 0 && (
            <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/15 dark:text-green-300">
              Save {plan.discount_percentage}%
            </span>
          )}
      </div>

      <div className="mb-1 flex items-end gap-2">
        <p className="text-4xl text-headingTextColor dark:text-darkTextPrimary">
          {formatDollars(displayPrice)}
        </p>
        {hasDiscount && basePrice !== null && basePrice !== undefined && (
          <p className="pb-1 text-lg text-subTextColor line-through dark:text-darkTextSecondary">
            {formatDollars(basePrice)}
          </p>
        )}
        <p className="pb-1 text-sm text-subTextColor dark:text-darkTextSecondary">
          / {periodLabel}
        </p>
      </div>

      {seatPrice !== null && seatPrice !== undefined && (
        <p className="mb-3 text-sm text-subTextColor dark:text-darkTextSecondary">
          {formatDollars(seatPrice)} per user / {perSeatUnit} — billed per user
        </p>
      )}

      {plan.description && (
        <p className="mb-4 text-sm text-subTextColor dark:text-darkTextSecondary">
          {plan.description}
        </p>
      )}

      <div className="mt-2">
        {!isAdmin ? (
          <p className="rounded-md border border-borderColor py-2.5 text-center text-sm text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary">
            Contact your admin
          </p>
        ) : isCurrent ? (
          <Button type="button" disabled className="w-full">
            Current plan
          </Button>
        ) : isFreePlan(plan) ? (
          <p className="rounded-md border border-borderColor py-2.5 text-center text-sm text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary">
            Applied automatically — no checkout needed
          </p>
        ) : hasPaid ? (
          <Button type="button" className="w-full" onClick={onSwitch}>
            Switch to this plan
          </Button>
        ) : (
          <Button type="button" className="w-full" onClick={onCheckout}>
            Get started
          </Button>
        )}
      </div>

      {plan.features && plan.features.length > 0 && (
        <ul className="mt-5 space-y-2 border-t border-borderColor pt-5 dark:border-darkBorder">
          {plan.features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-sm text-subTextColor dark:text-darkTextSecondary"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
