"use client";

import { useEffect, useRef, useState } from "react";
import { Crown, Info, Minus, Plus, ShieldCheck } from "lucide-react";

import CycleToggle from "@/components/Billing/CycleToggle";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatBillingDate,
  formatCents,
  MAX_ORDER_SEATS,
  seatCeilingFor,
} from "@/lib/billing";
import { cn } from "@/lib/utils";
import type {
  BillingCycle,
  IBillingPlan,
  ICheckoutQuote,
} from "@/types/billing";

/** Reads as "…/month" next to the headline price, per the design. */
const CYCLE_SUFFIX: Record<BillingCycle, string> = {
  monthly: "/month",
  quarterly: "/quarter",
  yearly: "/year",
};

const CYCLE_BILLED: Record<BillingCycle, string> = {
  monthly: "Billed monthly",
  quarterly: "Billed quarterly",
  yearly: "Billed yearly",
};

/**
 * The "Your Order" card.
 *
 * Every amount is rendered exactly as the server sent it. That is not
 * pedantry: the backend derives the invoice the customer downloads minutes
 * later from the same ladder, and any figure recomputed here — a subtotal from
 * seats × price, a tax line from a hardcoded rate — would eventually disagree
 * with the document they were actually charged against.
 *
 * The VAT row follows from the same rule. Stripe Tax is not enabled on the
 * account, so the quote returns `tax_cents: 0`, and the row is HIDDEN rather
 * than printed as a fabricated 20%. The day tax is switched on the quote starts
 * returning a real rate and the row appears on its own, with no change here.
 */
export default function OrderSummaryPanel({
  quote,
  plans,
  cycle,
  onCycleChange,
  seats,
  onSeatsChange,
  loading,
  disabled,
}: {
  quote: ICheckoutQuote | null;
  plans: IBillingPlan[];
  cycle: BillingCycle;
  onCycleChange: (cycle: BillingCycle) => void;
  seats: number;
  onSeatsChange: (seats: number) => void;
  loading?: boolean;
  /**
   * Freezes every order control. Passed while a payment is confirming: the
   * cycle toggle and seat stepper both re-quote, and a re-quote calls
   * `clearPending()`, destroying the PaymentIntent the retry has to reuse.
   */
  disabled?: boolean;
}) {
  const currency = quote?.currency ?? "usd";
  const features = (quote?.plan.features ?? [])
    .filter((f) => f.included)
    .slice(0, 4);
  // The catalogue row for the plan being bought — the quote carries its
  // identity but not its `available_cycles`, which the toggle needs.
  const ownPlan = plans.find((plan) => plan.id === quote?.plan.id) ?? null;
  const seatFloor = Math.max(1, quote?.seat_floor ?? 1);
  /**
   * The plan's own `max_seats`, not a bare 500 — the server rejects anything
   * above it, so a stepper that ignored the cap priced seats that could never
   * be bought. Falls back to the global ceiling until the plan row resolves.
   */
  const seatCeiling = ownPlan
    ? Math.max(seatFloor, seatCeilingFor(ownPlan))
    : MAX_ORDER_SEATS;
  /** Quoting OR paying — either way the order must not change underneath. */
  const locked = Boolean(loading || disabled);

  /**
   * The seat field while it is being typed.
   *
   * Kept separate from `seats` so the input can hold a transient value (an
   * empty box, a lone "1" on the way to "12") without each keystroke being
   * treated as a real seat count and re-pricing the order. It re-syncs
   * whenever the committed count changes — including when the server clamps it
   * up to the floor.
   */
  const [draft, setDraft] = useState(String(seats));
  /** See the input's handlers — true on mount and after every blur. */
  const selectOnFirstClick = useRef(true);
  useEffect(() => setDraft(String(seats)), [seats]);

  const commitDraft = () => {
    const parsed = Number.parseInt(draft, 10);
    const next = Number.isFinite(parsed)
      ? Math.min(seatCeiling, Math.max(seatFloor, parsed))
      : seats;

    setDraft(String(next));
    if (next !== seats) onSeatsChange(next);
  };

  return (
    <div className="rounded-xl border border-borderColor bg-bgPrimary p-5 dark:border-darkBorder dark:bg-darkPrimaryBg sm:p-6">
      <h2 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
        Your Order
      </h2>

      {/* Plan identity ------------------------------------------------ */}
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
            <Crown className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-headingTextColor dark:text-darkTextPrimary">
              {quote?.plan.name ?? "—"}
            </p>
            <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
              {CYCLE_BILLED[cycle]}
            </p>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xl font-bold text-headingTextColor dark:text-darkTextPrimary">
            {quote ? formatCents(quote.seat_price_cents, currency) : "—"}
          </p>
          <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
            {CYCLE_SUFFIX[cycle]}
          </p>
        </div>
      </div>

      {/* Included features -------------------------------------------- */}
      {features.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
            Top feature included -
          </p>
          <ul className="mt-2.5 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            {features.map((feature) => (
              <li
                key={feature.label}
                className="flex items-center gap-2 text-sm text-subTextColor dark:text-darkTextSecondary"
              >
                <ShieldCheck className="size-4 shrink-0 text-primary" />
                <span className="truncate">{feature.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="my-5 border-t border-borderColor dark:border-darkBorder" />

      {/* Seats ---------------------------------------------------------
          A first purchase is nearly always for more people than are in the
          workspace right now, so this has to be a real input. The floor comes
          from the server (`seat_floor` = active members); buying below it would
          be rejected, and buying at it would cap the very next invite. */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
            How many users?
          </p>
          <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
            {seatFloor > 1
              ? `At least ${seatFloor} — you have ${seatFloor} active members.`
              : "Add seats now for people you are about to invite."}
          </p>
        </div>

        <div className="flex h-10 shrink-0 items-center rounded-lg border border-borderColor dark:border-darkBorder">
          <button
            type="button"
            aria-label="Remove a seat"
            disabled={locked || seats <= seatFloor}
            onClick={() => onSeatsChange(Math.max(seatFloor, seats - 1))}
            className="flex h-full w-9 cursor-pointer items-center justify-center rounded-l-lg text-subTextColor transition-colors hover:text-headingTextColor disabled:pointer-events-none disabled:opacity-40 dark:text-darkTextSecondary dark:hover:text-darkTextPrimary"
          >
            <Minus className="size-4" />
          </button>
          {/* Typeable, not a read-out: adjusting 3 → 40 by clicking "+" is not
              a reasonable ask, and the same objection applies here as in the
              pre-checkout dialog. Committed on blur so a half-typed "1" on the
              way to "12" does not fire a quote for one seat. */}
          <input
            inputMode="numeric"
            aria-label="Number of users"
            value={draft}
            disabled={locked}
            onChange={(event) =>
              setDraft(event.target.value.replace(/[^\d]/g, ""))
            }
            // Select-all on the first click only. Suppressing every mouseup
            // kept the selection but made the field feel read-only — clicking
            // in to fix a digit could not move the caret (see CheckoutDialog).
            onFocus={(event) => {
              if (!selectOnFirstClick.current) return;
              event.target.select();
            }}
            onMouseUp={(event) => {
              if (!selectOnFirstClick.current) return;
              event.preventDefault();
              selectOnFirstClick.current = false;
            }}
            onBlur={() => {
              selectOnFirstClick.current = true;
              commitDraft();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className="w-12 bg-transparent text-center text-sm font-semibold tabular-nums text-headingTextColor outline-none disabled:opacity-50 dark:text-darkTextPrimary"
          />
          <button
            type="button"
            aria-label="Add a seat"
            disabled={locked || seats >= seatCeiling}
            onClick={() => onSeatsChange(Math.min(seatCeiling, seats + 1))}
            className="flex h-full w-9 cursor-pointer items-center justify-center rounded-r-lg text-subTextColor transition-colors hover:text-headingTextColor disabled:pointer-events-none disabled:opacity-40 dark:text-darkTextSecondary dark:hover:text-darkTextPrimary"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="my-5 border-t border-borderColor dark:border-darkBorder" />

      {/* Cycle switcher ------------------------------------------------
          Scoped to the plan being bought, not the whole catalogue: the toggle
          derives its options from `available_cycles`, so passing every plan
          would offer a cadence THIS plan is not sold on — and the server
          rejects that with "not sold on a <cycle> billing cycle", leaving the
          pill to snap back with no explanation. */}
      <CycleToggle
        plans={ownPlan ? [ownPlan] : plans}
        value={cycle}
        onChange={onCycleChange}
        // Manual activation: arrows move focus, Space/Enter switches the cycle.
        // `onCycleChange` is an undebounced `requote()` — a server call that
        // re-prices the order, re-configures the mounted Elements group and
        // throws away the pending PaymentIntent — so selecting as focus moved
        // would fire one per arrow press, and one per auto-repeat tick, while
        // the user was only reading the cadences on offer.
        activation="manual"
        disabled={locked}
        className="w-full"
      />

      <div className="my-5 border-t border-borderColor dark:border-darkBorder" />

      {/* Totals ladder ------------------------------------------------- */}
      <dl className={cn("space-y-2.5 text-sm", loading && "opacity-60")}>
        <div className="flex items-center justify-between">
          <dt className="text-subTextColor dark:text-darkTextSecondary">
            Subtotal
            {quote && quote.seats > 1 && (
              <span className="ml-1 text-xs">({quote.seats} seats)</span>
            )}
          </dt>
          <dd className="tabular-nums text-headingTextColor dark:text-darkTextPrimary">
            {quote ? formatCents(quote.subtotal_cents, currency) : "—"}
          </dd>
        </div>

        {/* Only when tax actually exists — see the component doc comment. */}
        {quote && quote.tax_cents > 0 && (
          <div className="flex items-center justify-between">
            <dt className="flex items-center gap-1.5 text-subTextColor dark:text-darkTextSecondary">
              VAT
              {quote.tax_rate_percent !== null && (
                <span>({quote.tax_rate_percent}%)</span>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="About VAT on this order"
                    className="cursor-pointer"
                  >
                    <Info className="size-3.5" />
                  </button>
                </TooltipTrigger>
                {/* The shared TooltipContent defaults to `text-background`,
                    which is white-on-white in light mode — every call site in
                    the app passes its own colour, so this one does too. */}
                <TooltipContent className="max-w-56 p-3 text-headingTextColor dark:text-darkTextPrimary">
                  Tax is calculated from your billing region and is shown on
                  your invoice.
                </TooltipContent>
              </Tooltip>
            </dt>
            <dd className="tabular-nums text-headingTextColor dark:text-darkTextPrimary">
              {formatCents(quote.tax_cents, currency)}
            </dd>
          </div>
        )}

        {quote && quote.discount_cents > 0 && (
          <div className="flex items-center justify-between">
            <dt className="text-green-600 dark:text-green-400">
              Coupon discount
            </dt>
            <dd className="tabular-nums text-green-600 dark:text-green-400">
              −{formatCents(quote.discount_cents, currency)}
            </dd>
          </div>
        )}

        <div className="border-t border-borderColor pt-3 dark:border-darkBorder">
          <div className="flex items-center justify-between">
            <dt className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
              Total due today
            </dt>
            <dd className="text-xl font-bold tabular-nums text-headingTextColor dark:text-darkTextPrimary">
              {quote ? formatCents(quote.total_cents, currency) : "—"}
            </dd>
          </div>

          {quote?.renews_at && (
            <p className="mt-1 text-xs text-subTextColor dark:text-darkTextSecondary">
              Renews on {formatBillingDate(quote.renews_at)}
            </p>
          )}
        </div>
      </dl>

      {/* The trial warning belongs next to the money, not in a dialog the user
          has already dismissed by the time they reach this button. */}
      {/* {quote?.trial_will_end_immediately && (
        <p className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Your free trial ends as soon as this payment completes and paid
          billing starts immediately.
        </p>
      )} */}

      <div className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:bg-green-500/10 dark:text-green-300">
        <ShieldCheck className="size-4 shrink-0" />
        14 day money back guarantee
      </div>
    </div>
  );
}
