"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { derivePlanGridFlags, isFreePlan } from "@/lib/billing";
import {
  BILLING_CYCLES,
  BillingCycle,
  CYCLE_LABEL,
  IBillingEntitlements,
  IBillingPlan,
} from "@/types/billing";
import PlanCard from "./PlanCard";
import CheckoutDialog from "./CheckoutDialog";
import Calender2Icon from "../Icons/Calender2Icon";
import FeatureBanner from "./FeatureBanner";
import CompareFeaturesPlan from "./CompareFeaturesPlan";
// import DownArrowIcon from "../Icons/PlanIcons/DownArrowIcon";

/**
 * The onboarding plan picker — `PlanPricingSection`'s grid without the
 * dashboard shell. It renders outside `(main_layout)`, before the zustand
 * billing store has ever been seeded, so everything arrives as props from the
 * server page (which also redirects anyone who already paid, making the
 * switch-plan dialog unreachable here — its `onSwitch` is deliberately inert).
 *
 * Cycle handling is identical to the settings grid: the toggle only shows
 * cycles at least one plan is actually sold on, each card hides on cycles it
 * does not offer, and the free plan (never sold) stays visible with its
 * caption CTA.
 */
export default function OnboardingPlanSelection({
  plans,
  entitlements,
  activeUserCount,
  isAdmin,
}: {
  plans: IBillingPlan[];
  entitlements: IBillingEntitlements | null;
  activeUserCount: number;
  isAdmin: boolean;
}) {
  const router = useRouter();
  console.log(plans);
  const { hasPaid, isCanceled, isTrial, isDelinquent } = derivePlanGridFlags(
    entitlements,
    plans,
  );

  // Declaration order (monthly → quarterly → yearly) is the cadence order the
  // toggle should read in, so filter BILLING_CYCLES rather than collecting.
  const supported: BillingCycle[] = BILLING_CYCLES.filter((c) =>
    plans.some((p) => p.available_cycles?.includes(c)),
  );

  // null = user hasn't toggled yet → follow the trial subscription's cycle.
  const [cycle, setCycle] = useState<BillingCycle | null>(null);
  const fallback: BillingCycle = supported[0] ?? "monthly";
  const preferred = cycle ?? entitlements?.billing_cycle ?? fallback;
  const effectiveCycle: BillingCycle = supported.includes(preferred)
    ? preferred
    : fallback;

  const visiblePlans = plans.filter(
    (p) => isFreePlan(p) || p.available_cycles?.includes(effectiveCycle),
  );
  console.log(visiblePlans);
  const anyDescription = visiblePlans.some((p) => Boolean(p.description));

  const [selectedPlan, setSelectedPlan] = useState<IBillingPlan | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [showCompareFeatures, setShowCompareFeatures] = useState(false);

  const handleCheckout = (plan: IBillingPlan) => {
    setSelectedPlan(plan);
    setCheckoutOpen(true);
  };

  // The Free plan is not billed on a cycle, so match it on plan id alone.
  const isCurrent = (plan: IBillingPlan): boolean =>
    entitlements?.plan_id === plan.id &&
    (isFreePlan(plan) || entitlements?.billing_cycle === effectiveCycle);
  console.log(supported)
  return (
    <div>
      {supported.length > 0 && (
        <div className="mb-8 flex justify-center">
          <div className="inline-flex h-12 rounded-lg bg-white p-1 outline-1 outline-borderColor/50 dark:bg-darkPrimaryBg dark:outline-darkBorder">
            {supported.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={effectiveCycle === c}
                onClick={() => setCycle(c)}
                className={cn(
                  "shrink-0 cursor-pointer rounded-md px-4 py-2 text-[13px] flex gap-2 items-center font-medium transition-all sm:text-sm",
                  effectiveCycle === c
                    ? "bg-primary text-white shadow"
                    : "text-subTextColor hover:text-gray-800 dark:text-darkTextPrimary",
                )}
              >
                <Calender2Icon className="" size={20} />
                {CYCLE_LABEL[c]}
                          {/* <span className="mt-1 shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-500/15 dark:text-green-300">
            Save {pricing.savings_percent}%
          </span> */}
              </button>
            ))}
          </div>
        </div>
      )}

      {visiblePlans.length === 0 ? (
        <p className="py-8 text-center text-sm text-subTextColor dark:text-darkTextSecondary">
          No plans are available right now — your trial is already running, so
          you can continue and pick one later.
        </p>
      ) : (
        <div
          className={cn(
            "grid gap-6 my-10 lg:my-20 md:grid-cols-2",
            // Four cards (Free + three paid) sit on one row on wide screens;
            // a three-plan catalog centers on three columns instead of
            // leaving a phantom fourth.
            visiblePlans.length >= 4 ? "xl:grid-cols-4" : "lg:grid-cols-3",
          )}
        >
          {visiblePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              cycle={effectiveCycle}
              isCurrent={isCurrent(plan)}
              isCanceled={isCanceled}
              isTrial={isTrial}
              isDelinquent={isDelinquent}
              hasPaid={hasPaid}
              isAdmin={isAdmin}
              reserveDescriptionSpace={anyDescription}
              onCheckout={() => handleCheckout(plan)}
              // Unreachable: the page redirects paid companies to the
              // dashboard, so no card ever resolves to "Switch to this plan".
              onSwitch={() => {}}
            />
          ))}
        </div>
      )}

      <FeatureBanner></FeatureBanner>

      {/* <p className=" text-subTextColor dark:text-darkTextSecondary font-medium text-center mt-5">All Plans are per user, per month. Prices in USD</p> */}
      <button
        type="button"
        onClick={() => setShowCompareFeatures((prev) => !prev)}
        className="mx-auto mt-11 flex cursor-pointer items-center gap-2 rounded-full bg-primary/10 px-5 py-2 font-semibold text-primary"
      >
        Compare All Features
        <svg
          width={25}
          height={25}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn(
            "transition-transform duration-200",
            showCompareFeatures && "rotate-180",
          )}
        >
          <path
            opacity="0.4"
            d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9"
            stroke="#0788F3"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 15C13.5811 14.9999 18 9 18 9"
            stroke="#0788F3"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {showCompareFeatures && <CompareFeaturesPlan />}

      <CheckoutDialog
        plan={selectedPlan}
        cycle={effectiveCycle}
        activeUserCount={activeUserCount}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        // This grid renders from server props, not the billing store, so the
        // dialog's store refetch cannot update it. Re-running the server page
        // picks up the existing subscription — whose redirect then moves the
        // admin along to the dashboard.
        onSubscriptionConflict={() => router.refresh()}
      />
    </div>
  );
}
