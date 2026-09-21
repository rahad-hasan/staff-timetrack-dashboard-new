"use client";

import SegmentedPills, {
  SegmentedPillOption,
  type SegmentedPillsActivation,
} from "@/components/Common/SegmentedPills";
import {
  BILLING_CYCLES,
  BillingCycle,
  CYCLE_LABEL,
  IBillingPlan,
} from "@/types/billing";
import Calender2Icon from "../Icons/Calender2Icon";

/**
 * The cycles a catalog is actually sold on.
 *
 * Declaration order (monthly → quarterly → yearly) is the cadence order the
 * toggle has to read in, so this filters `BILLING_CYCLES` rather than
 * collecting `available_cycles` — which arrives per plan and in no guaranteed
 * order. Exported because every caller needs the same list a second time, to
 * resolve its own `effectiveCycle` fallback: two derivations of "which cycles
 * exist" drifting apart is exactly how a toggle starts offering a cycle that no
 * card renders on.
 */
export const supportedCycles = (plans: IBillingPlan[]): BillingCycle[] =>
  BILLING_CYCLES.filter((cycle) =>
    plans.some((plan) => plan.available_cycles?.includes(cycle)),
  );

/**
 * Best advertised saving on `cycle`, across the plans that actually sell it.
 *
 * `savings_percent` is server-derived per plan (vs that plan's own monthly
 * price) and FLOORED there, so it can never promise more than a plan delivers.
 * Reading it off `cycle_pricing` keeps it honest about availability too (null =
 * not sold on this cycle, so that plan is not on the grid for it either).
 * Monthly is the baseline and always reports null, which keeps the first pill
 * badge-free.
 *
 * This is the MAX across plans, and one toggle sits above every card, so the
 * badge is necessarily somebody else's number for most readers — Pro saves
 * 35% on yearly where Max saves 33%. That is why the label reads "up to":
 * a bare "Save 35%" over a Max card would overstate by ~3 points. If the badge
 * ever needs to be exact per plan, it has to move onto PlanCard, not change
 * this aggregate.
 */
const maxSavingsPercent = (
  plans: IBillingPlan[],
  cycle: BillingCycle,
): number | null => {
  let best: number | null = null;

  for (const plan of plans) {
    const savings = plan.cycle_pricing?.[cycle]?.savings_percent;
    // 0 means the server floored a sub-1% saving away — noise, not an offer.
    if (typeof savings !== "number" || savings <= 0) continue;
    if (best === null || savings > best) best = savings;
  }

  return best;
};

/**
 * The billing-cycle toggle, shared by the settings pricing grid and the
 * onboarding plan picker (guide §2/§5).
 *
 * Both grids had grown their own copy of this markup, which is how they ended
 * up with different pill chrome for the same control — and how the "Save N%"
 * badges the design asks for would have had to be added twice.
 *
 * Renders nothing when the catalog sells on no cycle at all: the wrapper (and
 * with it the caller's spacing) disappears with the control, instead of leaving
 * an empty gap above the grid.
 */
export default function CycleToggle({
  plans,
  value,
  onChange,
  activation,
  ariaLabelledBy,
  className,
  disabled,
}: {
  plans: IBillingPlan[];
  value: BillingCycle;
  onChange: (cycle: BillingCycle) => void;
  /**
   * Keyboard commit mode, forwarded to the pills. Left at the shared default
   * (`automatic`) by the grids, whose `onChange` is a `setState`. A caller
   * whose cycle change costs a request per keystroke passes `manual` — see
   * `SegmentedPillsActivation`.
   */
  activation?: SegmentedPillsActivation;
  /**
   * Freezes the whole group. Used by the checkout order panel while a payment
   * is confirming: changing the cycle mid-charge re-quotes, and the re-quote
   * clears the PaymentIntent the retry depends on.
   */
  disabled?: boolean;
  /**
   * Id of EXISTING visible text that already reads "Billing cycle", for the
   * callers that render such a heading above the toggle. Without it those
   * surfaces announce the name twice — once from the heading, once from this
   * component's hardcoded `aria-label` — and the pills' `aria-label` is not
   * something a `FormLabel`/`htmlFor` can ever displace, because a
   * `div[role="radiogroup"]` is not a labelable element.
   */
  ariaLabelledBy?: string;
  /** Placement only — the caller owns where the toggle sits in its layout. */
  className?: string;
}) {
  const cycles = supportedCycles(plans);
  if (cycles.length === 0) return null;

  const options: SegmentedPillOption<BillingCycle>[] = cycles.map((cycle) => {
    const savings = maxSavingsPercent(plans, cycle);

    return {
      value: cycle,
      label: CYCLE_LABEL[cycle],
      icon: <Calender2Icon className="" size={20} />,
      badge: savings === null ? undefined : `Save up to ${savings}%`,
    };
  });

  return (
    <div className={className}>
      <SegmentedPills
        options={options}
        value={value}
        onChange={onChange}
        activation={activation}
        disabled={disabled}
        border={false}
        variant="loose"
        // The fallback name, for the surfaces that show no heading of their own
        // (the two pricing grids). `aria-labelledby` wins outright where it is
        // passed, so the two can never both be announced.
        ariaLabel="Billing cycle"
        aria-labelledby={ariaLabelledBy}
      />
    </div>
  );
};
