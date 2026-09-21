"use client";

import { useState } from "react";
import { derivePlanGridFlags, isFreePlan } from "@/lib/billing";
import { useBillingStore } from "@/store/billingStore";
import { useLogInUserStore } from "@/store/logInUserStore";
import { BillingCycle, IBillingPlan } from "@/types/billing";
import PlanCard from "./PlanCard";
import FaqSection from "./FaqSection";
import CheckoutDialog from "./CheckoutDialog";
import CycleToggle, { supportedCycles } from "./CycleToggle";
import SwitchPlanDialog from "./SwitchPlanDialog";
import CompareFeaturesPlan from "./CompareFeaturesPlan";
import TrustBadgeStrip from "./TrustBadgeStrip";
import SecureIcon from "../Icons/PlanIcons/SecureIcon";

/**
 * Pricing grid (guide §2/§5). The shared `CycleToggle` only shows cycles at
 * least one plan is actually sold on, and each card is hidden on a cycle it
 * does not offer — both read the server-derived `available_cycles`, which is
 * exactly the set of cycles with a Stripe price behind them, so the toggle can
 * never lead to a checkout that fails. Owns the checkout + switch-plan dialogs.
 *
 * It also closes with the same comparison table the onboarding picker uses, and
 * the billing FAQ.
 */
export default function PlanPricingSection({
  plans,
  activeUserCount,
  sectionId,
}: {
  plans: IBillingPlan[];
  activeUserCount: number;
  sectionId?: string;
}) {
  const entitlements = useBillingStore((s) => s.status?.entitlements ?? null);
  const role = useLogInUserStore((s) => s.logInUserData?.role);
  const isAdmin = role === "admin";
  // The CTA state machine's subscription-wide inputs — shared with the
  // onboarding plan picker so both grids resolve every card identically (the
  // reasoning behind each flag lives on `derivePlanGridFlags`).
  const { hasPaid, isCanceled, isTrial, isDelinquent } = derivePlanGridFlags(
    entitlements,
    plans,
  );

  // Same list the toggle renders from — resolving the fallback off anything
  // else is how a grid ends up on a cycle its own toggle cannot select.
  const supported: BillingCycle[] = supportedCycles(plans);

  // null = user hasn't toggled yet → follow the current subscription's cycle.
  const [cycle, setCycle] = useState<BillingCycle | null>(null);
  const fallback: BillingCycle = supported[0] ?? "monthly";
  const preferred = cycle ?? entitlements?.billing_cycle ?? fallback;
  const effectiveCycle: BillingCycle = supported.includes(preferred)
    ? preferred
    : fallback;

  // The free/downgrade plan sells on no cycle at all, so it would never match a
  // cycle filter — but it must stay on the grid (it renders a caption CTA, not
  // a checkout). Every other plan shows only on the cycles it is sold on.
  const visiblePlans = plans.filter(
    (p) => isFreePlan(p) || p.available_cycles?.includes(effectiveCycle),
  );

  // Taglines are optional per plan, so a grid where only some plans have one is
  // the normal state. Reserving the slot on every card in that case keeps the
  // price rows on one baseline instead of stepping down card by card.
  const anyDescription = visiblePlans.some((p) => Boolean(p.description));

  const [selectedPlan, setSelectedPlan] = useState<IBillingPlan | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [showCompareFeatures, setShowCompareFeatures] = useState(false);

  const handleCheckout = (plan: IBillingPlan) => {
    setSelectedPlan(plan);
    setCheckoutOpen(true);
  };

  const handleSwitch = (plan: IBillingPlan) => {
    setSelectedPlan(plan);
    setSwitchOpen(true);
  };

  // The Free plan is not billed on a cycle (a locally applied downgrade leaves
  // billing_cycle untouched), so match it on plan id alone — otherwise the
  // company's own plan renders as if it were still selectable.
  const isCurrent = (plan: IBillingPlan): boolean =>
    entitlements?.plan_id === plan.id &&
    (isFreePlan(plan) || entitlements?.billing_cycle === effectiveCycle);

  return (
    <div
      id={sectionId ?? "plans"}
      className="border border-borderColor rounded-lg p-3 sm:p-4 bg-white dark:bg-darkPrimaryBg dark:border-darkBorder"
    >
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="w-full">
            <span className="text-sm text-primary bg-primary/10 px-3 py-1 rounded-full">
              Pricing
            </span>
          </div>

          <h1 className="text-3xl mt-4 font-semibold text-headingTextColor dark:text-darkTextPrimary sm:text-4xl">
            Simple pricing.{" "}
            <span className=" text-primary">Powerful features</span>
          </h1>
          <p className="mt-3 text-subTextColor dark:text-darkTextSecondary">
            Choose the plan that fits your team. All plans are per user, per
            month
          </p>
        </div>

        <CycleToggle
          plans={plans}
          value={effectiveCycle}
          onChange={setCycle}
          className="gap-2 py-1 px-1 rounded-lg  shadow-[5px_05px_10px_rgba(0,0,0,0.02)] border border-borderColor/50 dark:border-darkBorder"
        />
      </div>

      {visiblePlans.length === 0 ? (
        <p className="py-8 text-center text-sm text-subTextColor dark:text-darkTextSecondary">
          No plans are available right now.
        </p>
      ) : (
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 pt-14">
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
              onSwitch={() => handleSwitch(plan)}
            />
          ))}
        </div>
      )}

      {/* Same reasoning as the onboarding picker: the table is headed with
          per-cycle prices, and `effectiveCycle` is client state, so it has to
          render here rather than one level up — a table quoting a different
          cadence than the cards above it would be worse than no table.
          Withheld on the empty state: the table self-guards on an empty plan
          list, but a "Compare All Features" trigger under a "no plans
          available" notice still promises a comparison of nothing. */}
      {/* {visiblePlans.length > 0 && (
        <PlanComparisonTable
          plans={visiblePlans}
          cycle={effectiveCycle}
          className="mt-10"
        />
      )} */}

      <TrustBadgeStrip marginTop="mt-10 md:mt-20" />

      <div className="flex justify-center gap-2 items-center mt-5">
        <SecureIcon className="text-black dark:text-white/60" size={20}/>
        <p className=" text-subTextColor dark:text-darkTextSecondary"> All Plans are per user, per month. Prices in USD</p>
      </div>

      <div className={`mt-10 flex justify-center`}>
        <button
          type="button"
          className="cursor-pointer rounded-full bg-primary/10 px-5 py-2 font-semibold text-primary"
          onClick={() => setShowCompareFeatures((prev) => !prev)}
        >
          {showCompareFeatures ? "Hide" : "Show Details"}
        </button>
      </div>

      {showCompareFeatures && <CompareFeaturesPlan margin="mt-10" />}
      {/* Unconditional, unlike the table above: the answers are about how
          billing behaves, not about what is on the grid, so they stay true (and
          useful) on a cycle where nothing happens to be sold. */}
      <FaqSection className="mt-10" />

      <CheckoutDialog
        plan={selectedPlan}
        cycle={effectiveCycle}
        activeUserCount={activeUserCount}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
      />
      <SwitchPlanDialog
        plan={selectedPlan}
        cycle={effectiveCycle}
        open={switchOpen}
        onOpenChange={setSwitchOpen}
      />
    </div>
  );
}
