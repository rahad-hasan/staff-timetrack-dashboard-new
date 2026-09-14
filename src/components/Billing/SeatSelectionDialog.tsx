"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Crown, Loader2, RefreshCw, Users } from "lucide-react";

import { getCheckoutQuote } from "@/actions/billing/action";
import NumberStepper from "@/components/Common/NumberStepper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatBillingDate,
  formatCents,
  MAX_ORDER_SEATS,
  seatCeilingFor,
} from "@/lib/billing";
import { cn } from "@/lib/utils";
import {
  BillingCycle,
  CYCLE_PERIOD_NOUN,
  IBillingPlan,
  ICheckoutQuote,
} from "@/types/billing";
import CycleToggle from "./CycleToggle";

/**
 * Seat range lives in `@/lib/billing` — one definition shared by every seat
 * input (this dialog, CheckoutDialog, OrderSummaryPanel, the checkout page).
 * Re-exported so existing `from "./SeatSelectionDialog"` imports keep working.
 */
export { seatCeilingFor };

/**
 * Where the stepper starts.
 *
 * A restored count (see `initialSeats`) is never trusted as-is: it can outlive
 * the plan it was chosen for, and it arrives from the caller's own storage.
 * Clamping it into this plan's real range means the worst a stale value can do
 * is prefill a number the user is looking at and can change.
 */
const openingSeats = (
  requested: number | null | undefined,
  floor: number,
  ceiling: number,
): number =>
  typeof requested === "number" && Number.isFinite(requested)
    ? Math.min(ceiling, Math.max(floor, Math.round(requested)))
    : floor;

/**
 * "How many seats do you need?" for a plan the user ALREADY chose on the
 * marketing site.
 *
 * This is not the pricing grid's pre-checkout dialog (`CheckoutDialog`) with a
 * different title. That one is opened by a card the user just clicked, so the
 * plan and the cadence are still on screen behind it and an estimate is enough.
 * Here the decision was made on another site, minutes and one signup ago, and
 * nothing on this screen has confirmed it yet — so this dialog has to state
 * both halves of what was chosen, and it has to be honest about the money:
 *
 * - The CYCLE is rendered as a live toggle, not a caption. The marketing site
 *   may send `?cycle=yearly` against a yearly headline price; charging monthly
 *   because the app defaulted there would be a bait-and-switch, and a cadence
 *   the buyer cannot see is one they cannot catch. The toggle is scoped to the
 *   plan being bought (`plans={[plan]}`) so it can only offer cadences that
 *   plan is actually sold on — the same rule `OrderSummaryPanel` follows.
 * - The TOTAL comes from `POST /packages/checkout/quote`, the same server
 *   ladder that builds the order summary on the next screen and the invoice
 *   after it. Nothing here multiplies a seat price by a seat count: a locally
 *   computed total that disagrees with the invoice by one rounding step is
 *   worse than showing no total at all.
 * - The MONEY AND THE BUTTON MOVE TOGETHER. Every figure below renders from
 *   `pricedQuote` — the quote only while it prices exactly this (plan, cycle,
 *   seats) — and the CTA is dead whenever that is null. One flag drives both,
 *   so there is no state in which this screen shows an amount it will not let
 *   you buy, or sends you to checkout against an amount it showed for a
 *   different order. `CheckoutPageClient` holds its own CTA on the same rule.
 *
 * Dismissing it is a first-class outcome — the caller leaves the plan grid
 * underneath, so "this isn't the plan I wanted" costs one Escape key.
 */
export default function SeatSelectionDialog({
  plan,
  cycle,
  onCycleChange,
  activeUserCount,
  initialSeats,
  open,
  onOpenChange,
  onContinue,
}: {
  /** The resolved intent plan. `null` renders nothing — the caller validates. */
  plan: IBillingPlan | null;
  cycle: BillingCycle;
  /**
   * Cadence is owned by the caller, not duplicated here: the grid behind the
   * modal prices its cards on the same value, and two sources of truth for
   * "which cycle are we buying" is exactly how the strip and the total drift.
   */
  onCycleChange: (cycle: BillingCycle) => void;
  /** Billable head count — the seat floor; 1 for a brand-new org. */
  activeUserCount: number;
  /**
   * Seat count to open on, when the caller is RESTORING a count this dialog
   * already collected (a Back out of checkout). Read only at the moment the
   * dialog opens, so it must not change while it is open; anything outside the
   * plan's range is clamped. Omit — or pass null — for the ordinary first ask,
   * which opens on the billable floor.
   */
  initialSeats?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * The user committed to `seats` and is being sent to checkout. Fires before
   * the navigation so the caller can remember the answer: this component is
   * about to unmount, and the count is the only thing the user decided here.
   */
  onContinue?: (seats: number) => void;
}) {
  const router = useRouter();

  const floor = Math.max(1, activeUserCount);
  // `Math.max(floor, …)` so a plan capped under the current team never hands
  // NumberStepper a max below its min (the caller refuses to auto-open onto
  // such a plan, but the component must not break if one is passed anyway).
  const ceiling = plan ? Math.max(floor, seatCeilingFor(plan)) : MAX_ORDER_SEATS;

  /**
   * Ties the visible "Billing cycle" heading to the toggle below it. The
   * toggle names itself "Billing cycle" as a fallback, so without this the
   * heading and the group's own `aria-label` are read back to back.
   */
  const cycleLabelId = useId();

  /** `NaN` while the box is empty — NumberStepper's contract, passed through. */
  const [seats, setSeats] = useState<number>(floor);
  const [quote, setQuote] = useState<ICheckoutQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  /**
   * A pricing failure, tagged with the exact order it happened on.
   *
   * The tag is what makes the message self-expiring: a 500 for 25 seats says
   * nothing about 26, so the moment the user nudges the stepper the error stops
   * applying and a fresh quote is allowed. It also stops the retry loop —
   * clearing `quote` on failure (which it must, see below) changes this
   * effect's inputs, and without a record of what just failed that alone would
   * re-fire the same doomed request.
   */
  const [failure, setFailure] = useState<{
    order: string;
    message: string;
  } | null>(null);
  const [navigating, setNavigating] = useState(false);

  /**
   * Monotonic quote counter. Seat nudges and cycle switches overlap and the
   * responses are not ordered; without this a slow early quote landing last
   * would leave a price on screen for an order the user has moved away from.
   * Bumping it also orphans anything still in flight when the dialog closes.
   */
  const latestQuote = useRef(0);
  /**
   * Has a price been shown since this dialog opened? Only the debounce reads
   * it: the first quote must be instant (a 400ms delay there is just an empty
   * money row on open), every later one waits for the stepper to settle.
   */
  const hasPriced = useRef(false);

  const planId = plan?.id ?? null;

  /** The order on screen, as one comparable value. */
  const order = `${planId}:${cycle}:${seats}`;

  /* Reset on every OPEN rather than on close: the dialog is mounted with the
     grid, so its state survives Radix closing it, and resetting on open wipes
     whatever a late response wrote while it was invisible before any of it can
     be seen. Same pattern as AddSeatsDialog. The floor is the default rather
     than the rule — `initialSeats` lets the caller reopen on a count the user
     already chose instead of silently walking it back. */
  useEffect(() => {
    if (!open) return;
    latestQuote.current += 1;
    hasPriced.current = false;
    setSeats(openingSeats(initialSeats, floor, ceiling));
    setQuote(null);
    setQuoting(false);
    setFailure(null);
    setNavigating(false);
  }, [open, floor, ceiling, initialSeats, planId]);

  const seatsValid =
    Number.isFinite(seats) && seats >= floor && seats <= ceiling;

  /** True when the quote on screen belongs to exactly this order. */
  const priced =
    quote !== null &&
    quote.plan.id === planId &&
    quote.cycle === cycle &&
    quote.seats === seats;

  /** This exact order was refused a price — asking again needs a new input. */
  const quoteFailed = failure !== null && failure.order === order;

  /**
   * Price the current order.
   *
   * Debounced once a price exists, because holding "+" would otherwise fire a
   * quote per click — but NOT on the first pass, where a 400ms delay would just
   * be an empty money row on open. The `priced` guard is what stops the quote
   * this effect produces from retriggering it, and `quoteFailed` is what stops
   * a failed one from doing the same.
   */
  useEffect(() => {
    if (!open || planId === null || !seatsValid || priced || quoteFailed) {
      return;
    }

    const timer = setTimeout(
      async () => {
        const requestId = latestQuote.current + 1;
        latestQuote.current = requestId;
        setQuoting(true);

        const res = await getCheckoutQuote({
          plan_id: planId,
          seats,
          cycle,
        });

        // A superseded response must not touch anything — least of all the price.
        if (latestQuote.current !== requestId) return;
        setQuoting(false);

        if (!res?.success || !res.data) {
          // The old price dies with the failed request. It was priced for the
          // order the user has just moved away from, and keeping it would
          // reprint it under the LIVE cycle and seat count — "$20.00 per seat,
          // per year" for a yearly quote that never came back. Blanking the
          // money is what holds the CTA (see `priced` at the button).
          setQuote(null);
          setFailure({
            order,
            message: res?.message || "We could not price this right now.",
          });
          return;
        }

        hasPriced.current = true;
        setFailure(null);
        setQuote(res.data);
        // The server clamps up to the billable floor. Adopting what it actually
        // priced keeps the stepper honest (it visibly snaps to the minimum) and
        // settles `priced` in one extra pass instead of re-requesting forever.
        if (res.data.seats !== seats) setSeats(res.data.seats);
      },
      hasPriced.current ? 400 : 0,
    );

    return () => clearTimeout(timer);
  }, [open, planId, cycle, seats, order, seatsValid, priced, quoteFailed]);

  if (!plan) return null;

  /**
   * The quote, but ONLY while it prices what is on screen right now.
   *
   * Every amount below reads from this instead of from `quote`, so there is no
   * path — a failed re-quote, a superseded one, a seat nudge still settling —
   * that can pair a server figure with a different order's labels.
   */
  const pricedQuote = priced ? quote : null;
  const currency = pricedQuote?.currency ?? "usd";
  /** Waiting on a price we intend to show — as opposed to having been refused. */
  const awaitingQuote = seatsValid && !priced && !quoteFailed;

  /** Re-ask for the price that just failed; the tag is the only thing barring it. */
  const retryQuote = () => setFailure(null);

  const submit = () => {
    // `priced` is the contract: what the next screen charges for is the order
    // this one showed a total for.
    if (!priced || !seatsValid || navigating) return;
    // Latched: the route change is not instant and a second click would push
    // the same checkout twice onto the history stack.
    setNavigating(true);
    // Handing the count up BEFORE navigating is what survives the unmount. A
    // Back out of checkout remounts the grid from scratch — params and all —
    // so without this the caller would reopen this dialog on the floor and
    // quietly sell a seat count nobody chose.
    onContinue?.(seats);
    router.push(
      `/billing/checkout?plan=${plan.id}&cycle=${encodeURIComponent(cycle)}&seats=${seats}`,
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Once Continue is pressed the navigation is committed and this
        // component is on its way out; an Escape landing in that window would
        // only register as "they dismissed it" against a decision they made.
        if (!next && navigating) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md dark:bg-darkSecondaryBg">
        <DialogHeader>
          <DialogTitle className="text-headingTextColor dark:text-darkTextPrimary">
            How many seats do you need?
          </DialogTitle>
          <DialogDescription className="text-subTextColor dark:text-darkTextSecondary">
            You picked{" "}
            <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
              {plan.name}
            </span>{" "}
            on our website. One seat per person who tracks time — you can add
            more later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* What was chosen, restated. The name alone is not the choice — the
              cadence is half the price, so it sits in the same block. The per
              seat line comes from the priced quote, whose `cycle` IS the cycle
              in the label; on anything else the plan's own blurb stands in. */}
          <div className="flex items-start gap-3 rounded-xl border border-borderColor bg-bgSecondary p-3 dark:border-darkBorder dark:bg-darkTertiaryBg">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
              <Crown className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-headingTextColor dark:text-darkTextPrimary">
                {plan.name}
              </p>
              <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                {pricedQuote
                  ? `${formatCents(pricedQuote.seat_price_cents, currency)} per seat, per ${CYCLE_PERIOD_NOUN[cycle]}`
                  : (plan.description ?? "Billed per seat")}
              </p>
            </div>
          </div>

          {/* Cycle — a control, never a caption (see the component doc). */}
          <div>
            {/* A heading, not a <label>: `htmlFor` can neither name nor focus a
                `div[role="radiogroup"]`. `aria-labelledby` is the wiring that
                does work, and it also stops the toggle's own "Billing cycle"
                fallback name from being announced after this line. */}
            <p
              id={cycleLabelId}
              className="mb-2 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary"
            >
              Billing cycle
            </p>
            <CycleToggle
              // Scoped to this plan so the toggle cannot offer a cadence the
              // plan is not sold on — the server rejects those and the pill
              // would snap back with no explanation.
              plans={[plan]}
              value={cycle}
              onChange={onCycleChange}
              ariaLabelledBy={cycleLabelId}
              className="w-full"
            />
          </div>

          {/* Seats */}
          <div>
            {/* A heading, not a <label>: NumberStepper's input carries its own
                `aria-label`, so an unassociated `for` here would only add a
                second, competing name. */}
            <p className="mb-2 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
              Number of users
            </p>
            <NumberStepper
              value={seats}
              onChange={setSeats}
              min={floor}
              max={ceiling}
              icon={Users}
              suffix={seats === 1 ? "seat" : "seats"}
              disabled={navigating}
              ariaLabel="number of seats"
            />

            {seatsValid ? (
              <p className="mt-2 text-xs text-subTextColor dark:text-darkTextSecondary">
                {floor > 1
                  ? `At least ${floor} — that is your current team.`
                  : "Add seats now for the people you are about to invite."}
              </p>
            ) : Number.isFinite(seats) ? (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {seats < floor
                  ? `You have ${floor} active ${floor === 1 ? "member" : "members"}, so you need at least ${floor} ${floor === 1 ? "seat" : "seats"}.`
                  : `${plan.name} covers up to ${ceiling} users. Enter a number between ${floor} and ${ceiling}.`}
              </p>
            ) : (
              /* NumberStepper reports an emptied box as NaN rather than
                 substituting a number — say so instead of silently disabling. */
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                Enter how many people need a seat.
              </p>
            )}
          </div>

          {/* Money. Every figure below is a server amount for THIS order,
              rendered as received; nothing on this screen multiplies a price by
              a seat count, and nothing here outlives the order it priced. */}
          <div
            className={cn(
              "rounded-xl border border-borderColor p-3 dark:border-darkBorder",
              quoting && "opacity-60",
            )}
          >
            <dl className="space-y-2 text-sm">
              {pricedQuote && pricedQuote.discount_cents > 0 && (
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-green-600 dark:text-green-400">Discount</dt>
                  <dd className="tabular-nums text-green-600 dark:text-green-400">
                    −{formatCents(pricedQuote.discount_cents, currency)}
                  </dd>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <dt className="font-semibold text-headingTextColor dark:text-darkTextPrimary">
                  Total due today
                </dt>
                <dd className="flex items-center gap-2 text-lg font-bold tabular-nums text-headingTextColor dark:text-darkTextPrimary">
                  {quoting && (
                    <Loader2
                      className="size-4 animate-spin text-subTextColor dark:text-darkTextSecondary"
                      aria-hidden
                    />
                  )}
                  {pricedQuote ? formatCents(pricedQuote.total_cents, currency) : "—"}
                </dd>
              </div>
            </dl>

            {pricedQuote?.renews_at && (
              <p className="mt-2 text-xs text-subTextColor dark:text-darkTextSecondary">
                Renews on {formatBillingDate(pricedQuote.renews_at)}
              </p>
            )}
          </div>

          {/* These users are mid reverse-trial, so this is the common case, not
              an edge one — and it belongs next to the money rather than on a
              screen they reach after committing. */}
          {pricedQuote?.trial_will_end_immediately && (
            <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              Your free trial ends as soon as this payment completes and paid
              billing starts immediately.
            </p>
          )}

          {/* A pricing failure is now a stop, not a shrug: with no total on
              screen there is nothing for the next step to honour, so the way
              out is to try again (or to change the order, which retries by
              itself) rather than to walk into checkout blind. */}
          {quoteFailed && failure && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="min-w-[12rem] flex-1 text-xs text-amber-800 dark:text-amber-300">
                {failure.message} We will not send you to payment until we can
                show you the exact total.
              </p>
              <Button
                type="button"
                variant="outline2"
                size="sm"
                onClick={retryQuote}
                disabled={navigating || quoting}
              >
                <RefreshCw className="size-3.5" />
                Try again
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          {/* Not "Cancel": dismissing leaves the full plan grid underneath, and
              saying so turns the escape hatch into an offer. It is also the way
              out of a pricing outage — every plan is still on the grid. */}
          <Button
            type="button"
            variant="outline2"
            onClick={() => onOpenChange(false)}
            disabled={navigating}
          >
            See all plans
          </Button>
          <Button
            type="button"
            onClick={submit}
            /* Alive only while a server price for THIS exact order is on
               screen. Pending, superseded and failed quotes all read the same
               way here, because they are the same thing to a buyer: an amount
               we cannot stand behind, and therefore not one to send anybody to
               payment with. */
            disabled={!priced || !seatsValid || navigating}
          >
            {(navigating || awaitingQuote) && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Continue to payment
            <ArrowRight className="size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
