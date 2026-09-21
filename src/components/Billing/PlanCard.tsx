"use client";

import { Check, Info, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDollars, isFreePlan } from "@/lib/billing";
import { 
  BillingCycle, 
  // CYCLE_PERIOD_NOUN, 
  IBillingPlan } from "@/types/billing";
import Image from "next/image";
import staterIcon from "@/components/Icons/PlanIcons/plan_starter.svg";
import proIcon from "@/components/Icons/PlanIcons/plan_pro.svg";
import maxIcon from "@/components/Icons/PlanIcons/plan_max.svg";
import starIcon from "@/components/Icons/PlanIcons/star.svg";

/**
 * One pricing card (guide §2).
 *
 * A plan has exactly ONE price per cycle — per seat, and exactly what Stripe
 * charges. Every cycle headlines its server-derived `monthly_equivalent` with
 * the real per-period charge spelled out underneath, so the large number is
 * always comparable across cycles and the amount that will actually be invoiced
 * is always on screen. `cycle_pricing[cycle] === null` means not sold.
 *
 * `description` is the admin-authored tagline and sits directly under the plan
 * name, where it reads as a description OF the plan — below the price it would
 * read as a caption ON the price. It is editorial only (bound to no limit), so
 * unlike a feature bullet it never claims an entitlement.
 *
 * CTA: current plan → disabled — unless nothing purchasable actually backs
 * "current". Canceled: the plan the company USED to have — nothing to keep or
 * switch, so the card offers "Reactivate plan" via checkout (the one path the
 * backend accepts for canceled companies). Trial lifecycle (trialing — running
 * or expired — and pending_downgrade_selection): the reverse trial parks every
 * company on the top-tier plan with no Stripe subscription, so a disabled
 * button would make the trialed plan the only one a trial company cannot buy —
 * offer "Upgrade now" via checkout instead (the backend converts it, warning
 * via `trialWillEndImmediately` when the trial is still running). Past-due /
 * payment-failed: the Stripe subscription still exists, so the backend rejects
 * BOTH checkout ("already exists") and switch-plan — the only valid action is
 * settling the open invoice, so non-current cards show that as a caption
 * instead of a CTA that dead-ends. Paid subscription → switch; else checkout.
 * The Free/default plan is never checkout-able — it is applied via downgrade
 * (trial-end "Switch to Free" or cancellation), so its CTA is a caption.
 * Non-admins never see a mutating CTA.
 */
export default function PlanCard({
  plan,
  cycle,
  isCurrent,
  isCanceled,
  isTrial,
  isDelinquent,
  hasPaid,
  isAdmin,
  reserveDescriptionSpace = false,
  onCheckout,
  onSwitch,
}: {
  plan: IBillingPlan;
  cycle: BillingCycle;
  isCurrent: boolean;
  isCanceled: boolean;
  isTrial: boolean;
  isDelinquent: boolean;
  hasPaid: boolean;
  isAdmin: boolean;
  /**
   * True when ANY card in the grid has a tagline: this card then keeps the
   * slot's height even without one, so prices stay on a single baseline across
   * the row. Taglines are optional per plan, so mixed grids are the norm.
   */
  reserveDescriptionSpace?: boolean;
  onCheckout: () => void;
  onSwitch: () => void;
}) {
  // Server-derived: null means this plan is not sold on this cycle.
  const pricing = plan.cycle_pricing?.[cycle] ?? null;
  // Trimmed on write and stored as NULL when blank (plan create AND update both
  // normalize), so what arrives is either real copy or nothing to render.
  const description = plan.description ?? null;
  return (
    <div
      className={cn(
        "relative flex flex-col border-2 border-borderColor rounded-2xl p-5 sm:p-6 bg-white dark:bg-darkPrimaryBg dark:border-darkBorder",
        plan.tier === "pro" &&
          "border-primary ring-1 ring-primary shadow-[0_0_20px_8px_rgba(0,0,0,0.07)] lg:min-h-[calc(100%+80px)] lg:my-[-40px]",
      )}
    >
      {plan.tier === "pro" && (
        <div className="absolute -top-3 right-0 -translate-x-1/2 whitespace-nowrap flex items-center gap-1.5 uppercase rounded-full bg-primary px-5 py-1 text-xs font-medium text-white">
          <Image
            src={starIcon}
            className={` -mt-[3px]`}
            width={14}
            height={14}
            alt="stater"
          />
          Most Popular
        </div>
      )}

      <div className="mb-4 flex items-start justify-between gap-2">
        <div className="flex items-start gap-5 border-b border-borderColor dark:border-darkBorder w-full">
          {plan.name === "Stater" ? (
            <Image
              src={staterIcon}
              className={`bg-[#ddf2e6] p-4 rounded-lg`}
              width={60}
              height={60}
              alt="stater"
            />
          ) : plan.name === "Max" ? (
            <Image
              src={maxIcon}
              className={`bg-[#f6edff] p-4 rounded-lg`}
              width={60}
              height={60}
              alt="stater"
            />
          ) : (
            <Image
              src={proIcon}
              className={`bg-[#daedfd] p-4 rounded-lg`}
              width={60}
              height={60}
              alt="stater"
            />
          )}

          <div>
            <div className=" flex justify-between items-center gap-4">
              <h3 className="text-3xl uppercase font-medium text-headingTextColor dark:text-darkTextPrimary">
                {plan.name}
              </h3>

              {plan.badge_text && (
                // plan.name === "Stater" ? "border-[#1ba855] text-[#1ba855]" : plan.name === "Max" ? "border-[#c286ff] text-[#c286ff]" : " bg-[linear-gradient(180deg,#427fe3,#3360c8)]
                <span
                  className={` ${plan.name === "Stater" ? "bg-[#1ba855]" : plan.name === "Max" ? "border-[#c286ff]" : "bg-[#0788f3]"} text-xs px-3 py-0.5 rounded-full text-white`}
                >
                  {plan.badge_text && plan.badge_text}
                </span>
              )}
            </div>
            {(description || reserveDescriptionSpace) && (
              <p
                className={cn(
                  "mt-1 line-clamp-2 wrap-break-word text-sm text-subTextColor dark:text-darkTextSecondary",
                  reserveDescriptionSpace && "min-h-10",
                )}
                title={description ?? undefined}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {pricing?.savings_percent != null && (
          <span
            className={`mt-1 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${plan.name === "Pro" ? "text-primary bg-primary/10" : "text-[#c286ff] bg-[#c286ff]/10"}`}
          >
            Save {pricing.savings_percent}%
          </span>
        )}
      </div>

      {/* {pricing ? ( */}
      {/* <div>
        <div className="mb-1 flex items-end gap-2">
          <p className="text-4xl text-headingTextColor dark:text-darkTextPrimary">
            {formatDollars(pricing.monthly_equivalent || 0)}
          </p>
          <p className="pb-1 text-sm text-subTextColor dark:text-darkTextSecondary">
            per user / month
          </p>
        </div>

        <p className="mb-3 text-sm text-subTextColor dark:text-darkTextSecondary">
          {cycle === "monthly"
            ? "Billed monthly per user"
            : `Billed ${formatDollars(pricing.seat_price || 0)} per user / ${CYCLE_PERIOD_NOUN[cycle]}`}
        </p>
      </div> */}

      <div>
        <div className="mb-1 flex items-end gap-2">
          <p
            className={`text-4xl font-bold ${plan.name === "Pro" ? "text-primary" : plan.name === "Max" ? "text-[#c286ff]" : "text-headingTextColor dark:text-darkTextPrimary"}`}
          >
            {formatDollars(pricing?.monthly_equivalent || 0)}
          </p>
          <p className="pb-1 text-sm text-subTextColor dark:text-darkTextSecondary">
            per user / month
          </p>
        </div>

        <p className="mb-3 text-sm text-subTextColor dark:text-darkTextSecondary">
          {pricing?.seat_price ? (
            <>${pricing.seat_price} per user, billed every month</>
          ) : (
            <>Free Forever</>
          )}
        </p>

        {/* <p className="mb-3 text-sm text-subTextColor dark:text-darkTextSecondary">
          {cycle === "monthly"
            ? "Billed monthly per user"
            : `Billed ${formatDollars(pricing?.seat_price || 0)} per user / ${CYCLE_PERIOD_NOUN[cycle]}`}
        </p> */}
      </div>

      {/* ) : (
        // Free/downgrade-target plans price both cycles at 0. "$0.00 per user"
        // reads as a deal being offered; this plan is not sold at all.
        <div className="mb-4 flex items-end gap-2">
          <p className="text-4xl text-headingTextColor dark:text-darkTextPrimary">
            Free
          </p>
        </div>
      )} */}

      <div className="mt-1">
        {!isAdmin ? (
          <p className="rounded-md border border-borderColor py-2.5 text-center text-sm text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary">
            Contact your admin
          </p>
        ) : isCurrent && isCanceled ? (
          <Button type="button" className="w-full" onClick={onCheckout}>
            Reactivate plan
          </Button>
        ) : isCurrent && isTrial && !isFreePlan(plan) ? (
          <button
            type="button"
            className={`w-full rounded-md border font-semibold cursor-pointer py-2.5 text-center text-sm ${plan.name === "Stater" ? "border-[#1ba855] text-[#1ba855]" : plan.name === "Max" ? "border-[#c286ff] text-[#c286ff]" : " bg-[linear-gradient(180deg,#427fe3,#3360c8)] text-white"}`}
            onClick={onCheckout}
          >
            Upgrade now
          </button>
        ) : isCurrent ? (
          <button
            type="button"
            disabled
            className={`w-full rounded-md border font-semibold cursor-not-allowed py-2.5 text-center text-sm ${plan.name === "Stater" ? "border-[#1ba855]/50 text-[#1ba855]/50" : plan.name === "Max" ? "border-[#c286ff]/50 text-[#c286ff]/50" : " bg-[linear-gradient(180deg,#427fe3,#3360c8)] text-white/50"}`}
          >
            Current plan
          </button>
        ) : isFreePlan(plan) ? (
          <button className="w-full rounded-md border border-[#1ba855] text-[#1ba855] font-semibold cursor-pointer py-2.5 text-center text-sm">
            Start Free
          </button>
        ) : // <p className="rounded-md border border-borderColor py-2.5 text-center text-sm text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary">
        //   Applied automatically — no checkout needed
        // </p>
        isDelinquent ? (
          <p className="rounded-md border border-borderColor py-2.5 text-center text-sm text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary">
            Settle your open invoice to change plans
          </p>
        ) : hasPaid ? (
          <Button
            type="button"
            className={`w-full rounded-md border font-semibold cursor-pointer py-2.5 text-center text-sm ${plan.name === "Stater" ? "border-[#1ba855] text-[#1ba855]" : plan.name === "Max" ? "border-[#c286ff] text-[#c286ff]" : " bg-[linear-gradient(180deg,#427fe3,#3360c8)] text-white"}`}
            onClick={onSwitch}
          >
            Switch to this plan
          </Button>
        ) : plan.name === "Max" ? (
          <button
            type="button"
            className="w-full rounded-md border border-[#c286ff] text-[#c286ff] font-semibold cursor-pointer py-2.5 text-center text-sm"
            onClick={onCheckout}
          >
            Get started
          </button>
        ) : (
          <Button type="button" className="w-full h-11" onClick={onCheckout}>
            Get started
          </Button>
        )}
      </div>

      {plan.features && plan.features.length > 0 && (
        <ul className="mt-5 space-y-4 border-t border-borderColor pt-5 dark:border-darkBorder">
          {plan.features.map((feature) => (
            <li
              key={feature.label}
              className={cn(
                "flex items-start justify-between gap-2 text-sm text-subTextColor dark:text-darkTextSecondary",
                // A limit can switch a listed feature off entirely (screenshots
                // disabled, a cap of 0). Showing it as a plain tick would claim
                // the plan includes something it does not.
                !feature.included && "opacity-60",
              )}
            >
              <div className=" flex items-center gap-2">
                {feature.included ? (
                  <Check
                    className={`-mt-0.5 p-0.5 h-4 w-4 shrink-0 rounded-full text-white ${plan.name === "Stater" ? "bg-[#1ba855]" : plan.name === "Max" ? "bg-[#c286ff]" : " bg-primary"}`}
                  />
                ) : (
                  <MinusCircle className="-mt-0.5 h-4 w-4 shrink-0 text-subTextColor dark:text-darkTextSecondary" />
                )}

                <span
                  className={cn(
                    !feature.included && "line-through",
                    "font-semibold",
                  )}
                >
                  {feature.label}
                </span>
              </div>

              {feature.note && (
                // `title` keeps the condition reachable without a tooltip
                // library — and, unlike a hover-only popover, it survives
                // keyboard focus and screen readers via aria-label.
                <span
                  className="inline-flex shrink-0 cursor-help text-subTextColor dark:text-darkTextSecondary"
                  title={feature.note}
                  aria-label={`${feature.label}: ${feature.note}`}
                  tabIndex={0}
                >
                  <Info className="h-4 w-4" />
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
