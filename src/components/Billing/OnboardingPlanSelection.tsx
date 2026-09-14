"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { derivePlanGridFlags, isFreePlan } from "@/lib/billing";
// Parsed once, on the server page, and judged with that module's own
// `describeMarketingPlanIntent`. Re-reading `?plan=` or re-deriving "is this
// plan sellable" here would be a second interpretation of the same input, and
// the two would eventually disagree — about what `trail=false` means, or about
// which cadence an un-cycled link buys on.
import {
  EMPTY_MARKETING_PLAN_INTENT,
  describeMarketingPlanIntent,
  type MarketingPlanIntent,
  type ResolvedMarketingPlanIntent,
} from "@/lib/marketingPlanIntent";
import {
  BILLING_CYCLES,
  BillingCycle,
  IBillingEntitlements,
  IBillingPlan,
} from "@/types/billing";
import PlanCard from "./PlanCard";
import CheckoutDialog from "./CheckoutDialog";
import CycleToggle, { supportedCycles } from "./CycleToggle";
import PlanComparisonTable from "./PlanComparisonTable";
import SeatSelectionDialog, { seatCeilingFor } from "./SeatSelectionDialog";
import TrustBadgeStrip from "./TrustBadgeStrip";

/** Where a marketing intent leaves this screen. */
interface IntentLanding {
  /**
   * The plan to auto-open the seat dialog for, or null when anything at all
   * refuses. Null is never a dead end: the grid renders either way.
   */
  purchase: ResolvedMarketingPlanIntent | null;
  /**
   * The cadence to open the grid on, or null for "no opinion — use the
   * subscription's". Set even when `purchase` is null, because being allowed
   * to BUY a plan and being allowed to SEE it are different questions.
   */
  cycle: BillingCycle | null;
}

/**
 * What the marketing intent means for this screen: which cadence the grid
 * opens on, and whether the seat dialog may open over it.
 *
 * `describeMarketingPlanIntent` owns the real validation (in the live catalog,
 * not the free/default plan, actually sold on the requested cycle). Two things
 * only this screen can add:
 *
 * - THE SAME FLAGS THE CARDS CONSULT. `PlanCard`'s CTA ladder does not offer a
 *   checkout to a non-admin ("Contact your admin"), to a delinquent company
 *   ("Settle your open invoice to change plans" — the backend rejects both
 *   checkout and switch-plan until the invoice is paid) or to one that already
 *   holds a Stripe subscription ("Switch to this plan", a different endpoint).
 *   The page redirects that last group, but the first two still land here: a
 *   modal offering "Continue to payment" on top of a grid that says payment is
 *   impossible is the screen contradicting itself, and the checkout it routes
 *   to would be refused anyway.
 * - THE SEAT CAP. A plan whose cap sits under the company's billable head
 *   count cannot be bought at any seat count the dialog could offer — every
 *   number in the stepper would be rejected — so auto-opening onto it would be
 *   a dead end wearing a price tag.
 *
 * Every refusal falls back to the ordinary grid, and the cadence still follows
 * the intent wherever the catalog allows it: the user keeps a running trial and
 * a full set of cards, so the worst outcome of a bad link is one extra click —
 * never a plan that has silently vanished from the grid they were sent to.
 */
const resolveIntentLanding = (
  intent: MarketingPlanIntent | null | undefined,
  plans: IBillingPlan[],
  supported: BillingCycle[],
  gate: { canCheckout: boolean; seatFloor: number },
): IntentLanding => {
  const outcome = describeMarketingPlanIntent(
    intent ?? EMPTY_MARKETING_PLAN_INTENT,
    plans,
  );

  if (outcome.status === "refused") {
    // `availableCycles` is populated for "cycle-not-sold" alone — the one
    // refusal that still knows which real plan was meant — and empty for the
    // rest, so this is inert on an ordinary signup or a junk plan id. Seeding
    // the cadence is not a purchase decision (nothing auto-opens here): it only
    // decides which cards survive the cycle filter, and the alternative is
    // someone who clicked "Business" landing on a grid with no Business card
    // and no explanation.
    return {
      purchase: null,
      cycle: outcome.availableCycles.find((c) => supported.includes(c)) ?? null,
    };
  }

  // Resolved: the cadence is one this plan is really sold on, so the grid opens
  // on it whether or not the dialog is allowed to open over it.
  const visible: IntentLanding = { purchase: null, cycle: outcome.cycle };

  if (!gate.canCheckout) return visible;
  if (seatCeilingFor(outcome.plan) < gate.seatFloor) return visible;

  return { ...visible, purchase: { plan: outcome.plan, cycle: outcome.cycle } };
};

/**
 * The answer the user has already given the seat dialog.
 *
 * It has to outlive React here. "Continue to payment" is a `router.push`, which
 * unmounts this component; a Back remounts it against params that are still in
 * the URL, so any protection held in component state is reset exactly when it
 * is needed. Both halves of the answer are worth keeping: the seat COUNT,
 * because silently reopening on the floor turns a 25-seat order into a 1-seat
 * one, and the DISMISSAL, because a question answered with "no thanks" should
 * not be asked again by a remount the user did not experience as an arrival.
 */
interface SeatDialogAnswer {
  planId: number;
  /** The cadence they were answering on — theirs, which outranks the link's. */
  cycle: BillingCycle;
  /** The count they committed to; null when they dismissed without one. */
  seats: number | null;
  /** True once Continue was pressed — the Back-from-checkout case. */
  continued: boolean;
}

/* Answers given in THIS document. Module scope is the whole point: it spans
   every mount of the page instance the user is still standing in (a Back out of
   checkout, a `router.refresh()`), and it dies with the document, so a genuinely
   new load never inherits a stale dismissal. */
let documentAnswer: SeatDialogAnswer | null = null;

/* A reload rebuilds the document and takes `documentAnswer` with it. Only one
   half is worth surviving that: losing a committed count is a silent downgrade
   to one seat, while losing a dismissal costs the Escape key again. So the
   mirror below stores a COMMITTED count only, which means no stored value can
   ever suppress the dialog — at worst it prefills a number that is on screen,
   clamped to the plan's range, and editable. sessionStorage rather than
   localStorage: this is one signup, in one tab. */
const COMMITTED_SEATS_KEY = "stafftime-choose-plan-seats";

const rememberAnswer = (answer: SeatDialogAnswer): void => {
  documentAnswer = answer;
  if (!answer.continued || answer.seats === null) return;

  try {
    window.sessionStorage.setItem(COMMITTED_SEATS_KEY, JSON.stringify(answer));
  } catch {
    // Private windows and blocked site data throw on write. The in-document
    // answer above already covers Back; this layer only adds reload survival.
  }
};

/** Browser-only — call it from an effect, never while rendering. */
const recallAnswer = (plan: IBillingPlan): SeatDialogAnswer | null => {
  /**
   * A cadence the plan no longer sells must never be restored. The modal's
   * CycleToggle is scoped to this ONE plan, so an unsold value renders every
   * pill unselected, and `visiblePlans` then filters the plan's own card off
   * the grid behind it — a screen asking about a plan it is not showing.
   *
   * Every other cycle on this page is already plan-checked (the intent
   * resolver, and the toggle itself). Restore is the only path that can
   * smuggle one in: the catalog can drop a cadence between the Continue and
   * the reload, and sessionStorage is user-editable.
   */
  const sells = (cycle: BillingCycle): boolean =>
    Boolean(plan.available_cycles?.includes(cycle));

  if (documentAnswer?.planId === plan.id) {
    return sells(documentAnswer.cycle) ? documentAnswer : null;
  }

  try {
    const raw = window.sessionStorage.getItem(COMMITTED_SEATS_KEY);
    if (!raw) return null;

    // Storage is user-editable and can also simply be older than this code, so
    // every field is re-checked. Anything short of a committed count for THIS
    // plan on a real cycle is dropped, and the screen just asks again.
    const stored = JSON.parse(raw) as Partial<SeatDialogAnswer> | null;
    if (!stored || stored.planId !== plan.id || stored.continued !== true) {
      return null;
    }
    if (!Number.isInteger(stored.seats) || (stored.seats as number) < 1) {
      return null;
    }
    if (!BILLING_CYCLES.includes(stored.cycle as BillingCycle)) return null;
    if (!sells(stored.cycle as BillingCycle)) return null;

    return {
      planId: plan.id,
      cycle: stored.cycle as BillingCycle,
      seats: stored.seats as number,
      continued: true,
    };
  } catch {
    return null;
  }
};

/**
 * The onboarding plan picker — `PlanPricingSection`'s grid without the
 * dashboard shell. It renders outside `(main_layout)`, before the zustand
 * billing store has ever been seeded, so everything arrives as props from the
 * server page (which also redirects anyone who already paid, making the
 * switch-plan dialog unreachable here — its `onSwitch` is deliberately inert).
 *
 * Cycle handling is identical to the settings grid — both drive the shared
 * `CycleToggle`, so the toggle only shows cycles at least one plan is actually
 * sold on, each card hides on cycles it does not offer, and the free plan
 * (never sold) stays visible with its caption CTA.
 *
 * It also owns the page's trust strip and comparison table: both sit below the
 * grid in the design, and the table is headed with per-cycle prices, so it has
 * to read the same `effectiveCycle` the cards do.
 *
 * Finally it owns the marketing-intent shortcut. A user who already picked a
 * paid plan on the website has answered this screen's question before arriving,
 * so re-asking it is a regression, not a confirmation: when the intent resolves
 * — and when this company is actually allowed to check out — the seat dialog
 * opens straight over the grid. The grid is still rendered underneath, so
 * dismissing the dialog is a real choice and not a dead end, and the answer
 * they give it is remembered outside React (see `SeatDialogAnswer`) because the
 * params that opened it live in the URL forever while the component does not.
 */
export default function OnboardingPlanSelection({
  plans,
  entitlements,
  activeUserCount,
  isAdmin,
  intent,
}: {
  plans: IBillingPlan[];
  entitlements: IBillingEntitlements | null;
  activeUserCount: number;
  isAdmin: boolean;
  /**
   * What the user picked on the marketing site, already parsed. `null` on the
   * ordinary path (signup → wizard → here), which must keep behaving exactly
   * as it did.
   */
  intent?: MarketingPlanIntent | null;
}) {
  const router = useRouter();

  const { hasPaid, isCanceled, isTrial, isDelinquent } = derivePlanGridFlags(
    entitlements,
    plans,
  );

  // Same list the toggle renders from — resolving the fallback off anything
  // else is how a grid ends up on a cycle its own toggle cannot select.
  const supported: BillingCycle[] = supportedCycles(plans);

  const fallback: BillingCycle = supported[0] ?? "monthly";

  /**
   * What the marketing intent means here, resolved once against the catalog
   * and then frozen.
   *
   * Deliberately a lazy `useState` initialiser and NOT a live derivation: the
   * inputs move (the toggle, `plans` refetched by a `router.refresh()`) while
   * the params stay in the URL for the whole life of the page, so a derivation
   * that re-ran would keep re-answering a question the user has already dealt
   * with. Frozen at mount, it can only be read.
   */
  const [landing] = useState<IntentLanding>(() =>
    resolveIntentLanding(intent, plans, supported, {
      // `PlanCard`'s CTA ladder as one question: would this plan's own card
      // offer a checkout at all? The dialog must never contradict the cards
      // behind it — see `resolveIntentLanding`.
      canCheckout: isAdmin && !isDelinquent && !hasPaid,
      seatFloor: Math.max(1, activeUserCount),
    }),
  );
  const resolvedIntent = landing.purchase;

  /**
   * The seat dialog opens from the effect below, never from an initial value.
   *
   * The decision needs the remembered answer, which lives in `sessionStorage`
   * and in module scope — neither exists during the server render — and the
   * dialog is portal-mounted, so it was never in the server HTML anyway and
   * nothing about the first paint changes by deciding one tick later.
   */
  const [seatDialogOpen, setSeatDialogOpen] = useState(false);
  /** A count restored from a previous answer; null = ask from the floor. */
  const [restoredSeats, setRestoredSeats] = useState<number | null>(null);

  /* null = user hasn't toggled yet → follow the cadence the intent landed on,
     then the trial subscription's. The intent's cycle has to outrank
     `entitlements.billing_cycle` (the trial's cadence, which nobody chose):
     landing on Monthly after clicking a yearly price is a bait-and-switch, and
     the seat dialog reads its cycle from right here. It is always a cycle some
     plan is sold on, so it is always in `supported`. */
  const [cycle, setCycle] = useState<BillingCycle | null>(landing.cycle);
  const preferred = cycle ?? entitlements?.billing_cycle ?? fallback;
  const effectiveCycle: BillingCycle = supported.includes(preferred)
    ? preferred
    : fallback;

  /**
   * Open on arrival — or restore the answer already given.
   *
   * `resolvedIntent` is frozen state, so this runs exactly once per mount by
   * construction, which is the same guarantee an initial value would give. What
   * it adds is the only thing that can survive the unmount `router.push` causes:
   *
   *   - no answer yet        → ask (the first arrival, and a reload before the
   *                            user has answered anything);
   *   - they pressed Continue → reopen on their seats and their cadence, so a
   *                            Back out of checkout returns to the order they
   *                            built rather than to a silently reset one;
   *   - they dismissed it     → leave the grid alone, keeping the cadence they
   *                            were last looking at.
   */
  useEffect(() => {
    if (!resolvedIntent) return;

    const answered = recallAnswer(resolvedIntent.plan);
    if (!answered) {
      setSeatDialogOpen(true);
      return;
    }

    setCycle(answered.cycle);
    if (answered.seats !== null) setRestoredSeats(answered.seats);
    setSeatDialogOpen(answered.continued);
  }, [resolvedIntent]);

  const visiblePlans = plans.filter(
    (p) => isFreePlan(p) || p.available_cycles?.includes(effectiveCycle),
  );

  const anyDescription = visiblePlans.some((p) => Boolean(p.description));

  const [selectedPlan, setSelectedPlan] = useState<IBillingPlan | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const handleCheckout = (plan: IBillingPlan) => {
    setSelectedPlan(plan);
    setCheckoutOpen(true);
  };

  /**
   * Closing the seat dialog is always a dismissal: it refuses Radix's close
   * once Continue has been pressed, so nothing else reaches here. Recording it
   * is what stops a remount — a Back from anywhere, a refresh — from re-asking
   * a question this user has already answered with "no".
   */
  const handleSeatDialogOpenChange = (next: boolean) => {
    setSeatDialogOpen(next);
    if (next || !resolvedIntent) return;

    rememberAnswer({
      planId: resolvedIntent.plan.id,
      cycle: effectiveCycle,
      seats: null,
      continued: false,
    });
  };

  /** They committed to a count and are on their way to checkout. */
  const handleSeatDialogContinue = (seats: number) => {
    if (!resolvedIntent) return;

    rememberAnswer({
      planId: resolvedIntent.plan.id,
      cycle: effectiveCycle,
      seats,
      continued: true,
    });
  };

  // The Free plan is not billed on a cycle, so match it on plan id alone.
  const isCurrent = (plan: IBillingPlan): boolean =>
    entitlements?.plan_id === plan.id &&
    (isFreePlan(plan) || entitlements?.billing_cycle === effectiveCycle);

  return (
    <div>
      <CycleToggle
        plans={plans}
        value={effectiveCycle}
        onChange={setCycle}
        className="mb-8 flex justify-center"
      />

      {visiblePlans.length === 0 ? (
        <p className="py-8 text-center text-sm text-subTextColor dark:text-darkTextSecondary">
          No plans are available right now — your trial is already running, so
          you can continue and pick one later.
        </p>
      ) : (
        <div
          className={cn(
            "grid gap-6 pt-3 md:grid-cols-2",
            // Four cards (Free + three paid) sit on one row on wide screens;
            // a three-plan catalog centers on three columns instead of
            // leaving a phantom fourth.
            visiblePlans.length >= 4 ? "xl:grid-cols-4" : "xl:grid-cols-3",
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

      <TrustBadgeStrip className="mt-10" />

      {/* Lives here rather than on the server page purely because of the cycle:
          `effectiveCycle` is client state, and a table headed with prices from
          a different cadence than the cards above it would be worse than no
          table. The strip follows it so the page keeps one footer block. */}
      <PlanComparisonTable
        plans={visiblePlans}
        cycle={effectiveCycle}
        className="mt-10"
      />

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

      {/* Only mounted when the marketing intent actually resolved into a plan
          this company may buy, so the ordinary path costs nothing. The cycle is
          shared with the grid rather than duplicated: changing it in the dialog
          re-prices the cards behind it, which is the point — the cadence must
          never be something the user cannot see or change. */}
      {resolvedIntent && (
        <SeatSelectionDialog
          plan={resolvedIntent.plan}
          cycle={effectiveCycle}
          onCycleChange={setCycle}
          activeUserCount={activeUserCount}
          initialSeats={restoredSeats}
          open={seatDialogOpen}
          onOpenChange={handleSeatDialogOpenChange}
          onContinue={handleSeatDialogContinue}
        />
      )}
    </div>
  );
}
