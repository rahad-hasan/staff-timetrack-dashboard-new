"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { canMutateSubscription, isFreePlan } from "@/lib/billing";
import { useBillingStore } from "@/store/billingStore";
import { useLogInUserStore } from "@/store/logInUserStore";
import {
  BILLING_CYCLES,
  BillingCycle,
  CYCLE_LABEL,
  IBillingPlan,
} from "@/types/billing";
import PlanCard from "./PlanCard";
import CheckoutDialog from "./CheckoutDialog";
import SwitchPlanDialog from "./SwitchPlanDialog";

/**
 * Pricing grid (guide §2/§5). The cycle toggle only shows cycles at least one
 * plan is actually sold on, and each card is hidden on a cycle it does not
 * offer — both read the server-derived `available_cycles`, which is exactly the
 * set of cycles with a Stripe price behind them, so the toggle can never lead
 * to a checkout that fails. Owns the checkout + switch-plan dialogs.
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
  // Free-plan companies have no Stripe subscription to switch, so they must be
  // routed to checkout — resolved against the live plans list rather than the
  // (cacheable) entitlement snapshot.
  const hasPaid = canMutateSubscription(entitlements, plans);
  // A canceled subscription keeps its plan_id/billing_cycle, so the old plan
  // still matches `isCurrent` — but there is nothing to keep or switch, and
  // checkout is the only flow the backend accepts for canceled companies. The
  // card must offer reactivation instead of a disabled "Current plan".
  const isCanceled = entitlements?.status === "canceled";
  // The trial lifecycle — trialing (running or expired) AND
  // pending_downgrade_selection (expired over the Free plan's limits) — has no
  // Stripe subscription behind it, and checkout is the one flow that converts
  // it. The trialed plan's card must offer "Upgrade now" instead of a disabled
  // "Current plan", or the plan the company is trialing becomes the only one
  // it cannot buy — in the selection state that is exactly the plan the
  // "Keep everyone — upgrade instead" takeover funnels the admin toward.
  const isTrial =
    entitlements?.status === "trialing" ||
    entitlements?.status === "pending_downgrade_selection";
  // While a payment failure is unresolved the Stripe subscription still
  // exists, so the backend rejects both checkout ("already exists") and
  // switch-plan — settling the open invoice (PayNowCard above) is the only
  // action that can succeed.
  const isDelinquent =
    entitlements?.status === "past_due" ||
    entitlements?.status === "payment_failed";

  // Declaration order (monthly → quarterly → yearly) is the cadence order the
  // toggle should read in, so filter BILLING_CYCLES rather than collecting.
  const supported: BillingCycle[] = BILLING_CYCLES.filter((c) =>
    plans.some((p) => p.available_cycles?.includes(c)),
  );

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
          <h2 className="mb-1.5 text-xl font-medium text-headingTextColor dark:text-darkTextPrimary">
            Plans &amp; pricing
          </h2>
          <p className="text-subTextColor dark:text-darkTextSecondary">
            Choose the plan that fits your team.
          </p>
        </div>

        {supported.length > 0 && (
          <div className="mt-3 inline-flex h-10 self-start rounded-lg bg-bgSecondary dark:bg-darkSecondaryBg sm:mt-0 sm:self-auto">
            {supported.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={effectiveCycle === c}
                onClick={() => setCycle(c)}
                className={cn(
                  "flex-shrink-0 cursor-pointer rounded-lg px-3 py-2 text-[13px] font-medium transition-all sm:text-sm",
                  effectiveCycle === c
                    ? "bg-bgPrimary text-headingTextColor shadow outline-1 outline-borderColor dark:bg-darkPrimaryBg dark:text-darkTextPrimary dark:outline-darkBorder"
                    : "text-subTextColor hover:text-gray-800 dark:text-darkTextPrimary",
                )}
              >
                {CYCLE_LABEL[c]}
              </button>
            ))}
          </div>
        )}
      </div>

      {visiblePlans.length === 0 ? (
        <p className="py-8 text-center text-sm text-subTextColor dark:text-darkTextSecondary">
          No plans are available right now.
        </p>
      ) : (
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6 pt-3">
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
