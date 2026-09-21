"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { BillingCycle, IBillingPlan } from "@/types/billing";
import CompareFeaturesPlan from "./CompareFeaturesPlan";

/** One plan's answer for one feature row. `null` = the plan never lists it. */
interface FeatureCell {
  included: boolean;
  /** The server-derived ⓘ condition ("Up to 3 projects"). Never hand-written. */
  note: string | null;
}

interface FeatureRow {
  label: string;
  /** Index-aligned with `plans` — a missing feature is a `null` cell, not a gap. */
  cells: (FeatureCell | null)[];
}

interface LimitRow {
  label: string;
  /** Index-aligned with `plans`; already formatted for display. */
  values: string[];
}

/** `max_seats` → "Max seats". The keys are already readable snake_case. */
const humaniseLimitKey = (key: string): string => {
  const words = key.replace(/_/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * -1 means "unlimited" for every limit EXCEPT the screenshot cadence, where the
 * backend inverts the sentinel: there it (and 0) mean screenshots are DISABLED
 * — the same rule that makes those bullets render `included: false` upstream.
 * Printing "Unlimited" for it would advertise the exact opposite of the truth,
 * so the one key with the inverted sentinel is special-cased rather than run
 * through the generic formatter.
 */
const formatLimitValue = (key: string, value: number): string => {
  if (key === "screenshot_interval_in_minute") {
    return value <= 0 ? "Not included" : `Every ${value} min`;
  }
  return value === -1 ? "Unlimited" : String(value);
};

/**
 * "Compare All Features" — the expandable spec table at the foot of the pricing
 * page (guide §3).
 *
 * Collapsed by default and hand-rolled: the repo carries no accordion
 * primitive, and one `useState` plus `aria-expanded`/`aria-controls` is the
 * whole contract. The panel is hidden with the `hidden` attribute rather than
 * unmounted so `aria-controls` always resolves to a real element.
 *
 * Rows are the UNION of every visible plan's `features[]`, in first-seen order:
 * plans list only what they sell, so a per-plan list would render a different
 * table per column. Each cell prints that plan's OWN `note` under the tick —
 * the note is derived from the plan's real limits server-side, so this is the
 * one place the table stops being a wall of identical ticks and actually
 * compares. Never recompute a note here.
 *
 * A11y: this table carries its entire meaning in ticks and dashes, which is
 * nothing at all without sight — lucide stamps `aria-hidden` on any icon given
 * no a11y prop, so an unlabelled `<Check />` cell and an unlabelled `<Minus />`
 * cell are announced identically, as empty. Every cell therefore carries an
 * sr-only "Included" / "Not included", and the feature/limit labels are real
 * `<th scope="row">` headers so a screen reader can say WHICH feature and WHICH
 * plan an answer belongs to. Both halves are load-bearing: a labelled cell with
 * no row header still reads as a floating "Included".
 */
export default function PlanComparisonTable({
  plans,
  cycle,
  className,
}: {
  plans: IBillingPlan[];
  cycle: BillingCycle;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // const panelId = useId();

  const { featureRows, limitRows } = useMemo(() => {
    // Label → feature, per plan. Built once per plan instead of scanning
    // `features[]` again for every row × column pair.
    const byLabel = plans.map((plan) => {
      const map = new Map<string, FeatureCell>();
      for (const feature of plan.features ?? []) {
        map.set(feature.label, {
          included: feature.included,
          note: feature.note,
        });
      }
      return map;
    });

    const order: string[] = [];
    const seen = new Set<string>();
    for (const plan of plans) {
      for (const feature of plan.features ?? []) {
        if (seen.has(feature.label)) continue;
        seen.add(feature.label);
        order.push(feature.label);
      }
    }

    const features: FeatureRow[] = order.map((label) => ({
      label,
      cells: byLabel.map((map) => map.get(label) ?? null),
    }));

    // Only plans that actually carry a `limits` object can agree on a key, and
    // a key earns a row only when every one of them reports it as a NUMBER —
    // that is what drops `feature_flags` (an object) and any string a future
    // limit might use, without having to enumerate the keys client-side.
    const withLimits = plans.filter(
      (
        plan,
      ): plan is IBillingPlan & {
        limits: NonNullable<IBillingPlan["limits"]>;
      } => Boolean(plan.limits),
    );

    const sharedKeys =
      withLimits.length === 0
        ? []
        : Object.keys(withLimits[0].limits).filter((key) =>
            withLimits.every((plan) => typeof plan.limits[key] === "number"),
          );

    const limits: LimitRow[] = sharedKeys.map((key) => ({
      label: humaniseLimitKey(key),
      values: plans.map((plan) => {
        const value = plan.limits?.[key];
        return typeof value === "number" ? formatLimitValue(key, value) : "—";
      }),
    }));

    return { featureRows: features, limitRows: limits };
  }, [plans]);

  // Nothing to compare — two columns of ticks with no rows is worse than no
  // section at all.
  if (
    plans.length === 0 ||
    (featureRows.length === 0 && limitRows.length === 0)
  ) {
    return null;
  }

  return (
    <div className={className}>
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="mx-auto flex cursor-pointer items-center gap-2 rounded-full bg-primary/10 px-5 py-2 font-semibold text-primary"
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
              open && "rotate-180",
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
      </div>
      {open && <CompareFeaturesPlan margin="mt-10"></CompareFeaturesPlan>}
    </div>
  );
}
