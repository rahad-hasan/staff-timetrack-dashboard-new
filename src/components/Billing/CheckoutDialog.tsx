"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Minus, Plus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDollars, seatCeilingFor } from "@/lib/billing";
import {
  BillingCycle,
  CYCLE_PERIOD_NOUN,
  IBillingPlan,
} from "@/types/billing";


/**
 * "How many seats?" — the first step of a purchase.
 *
 * Seats are asked for BEFORE the card, because the number is a decision and
 * the card is not: a company signing up with one admin is usually buying for
 * the team it is about to invite, and discovering that only on the payment
 * screen means re-reading a total you had already accepted. Answering it here
 * means the checkout page opens with the right amount already on it.
 *
 * The count defaults to the workspace's current billable head count, which is
 * also the floor — you cannot buy fewer seats than you have active members,
 * and the server rejects it independently. It is deliberately a typeable
 * field, not only a stepper: stepping from 1 to 40 one click at a time is not
 * a reasonable ask.
 *
 * The seat count is the only thing collected here. The discount code and the
 * billing cycle live on the checkout page beside the running total, where
 * changing them visibly re-prices the order.
 */
export default function CheckoutDialog({
  plan,
  cycle,
  activeUserCount,
  open,
  onOpenChange,
}: {
  plan: IBillingPlan | null;
  cycle: BillingCycle;
  activeUserCount: number;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /**
   * Retained for call-site compatibility. The "subscription already exists"
   * conflict no longer surfaces: the subscribe endpoint resolves an existing
   * subscription into a prorated switch instead of rejecting it.
   */
  onSubscriptionConflict?: () => void;
}) {
  const router = useRouter();

  const floor = Math.max(1, activeUserCount);
  /** Held as a string so the field can be cleared and retyped. */
  const [seats, setSeats] = useState(String(floor));
  const [navigating, setNavigating] = useState(false);
  /**
   * Whether the next click should select the whole value. True on open and
   * after every blur, cleared once the field has been clicked into — see the
   * input's handlers.
   */
  const selectOnFirstClick = useRef(true);

  // Reset on every open: this dialog is mounted with the grid, so without it
  // the next plan opens showing the seat count typed for the previous one.
  useEffect(() => {
    if (!open) return;
    setSeats(String(floor));
    setNavigating(false);
    selectOnFirstClick.current = true;
  }, [open, floor, plan?.id]);

  if (!plan) return null;

  /**
   * The plan's OWN ceiling, not just the global 500. The server rejects seats
   * above `max_seats` on both purchase paths, so offering more here quotes and
   * charges for seats the entitlement engine will never grant. `Math.max` with
   * the floor keeps the range valid when a company's head count already
   * exceeds the cap — the quote answers that case with a "pick a bigger plan"
   * message rather than an impossible min > max input.
   */
  const ceiling = Math.max(floor, seatCeilingFor(plan));

  const parsed = Number.parseInt(seats, 10);
  const valid = Number.isFinite(parsed) && parsed >= floor && parsed <= ceiling;
  /** Clamped view of the field, for the estimate and the stepper buttons. */
  const effective = valid ? parsed : floor;

  const seatPrice = plan.cycle_pricing?.[cycle]?.seat_price ?? null;

  const nudge = (delta: number) =>
    setSeats(String(Math.min(ceiling, Math.max(floor, effective + delta))));

  const submit = () => {
    if (!valid || navigating) return;
    // Latched: the route change is not instant, and a second click would push
    // the same checkout twice onto the history stack.
    setNavigating(true);
    onOpenChange(false);
    router.push(
      `/billing/checkout?plan=${plan.id}&cycle=${encodeURIComponent(cycle)}&seats=${parsed}`,
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md dark:bg-darkSecondaryBg">
        <DialogHeader>
          <DialogTitle className="text-headingTextColor dark:text-darkTextPrimary">
            How many seats do you need?
          </DialogTitle>
          <DialogDescription className="text-subTextColor dark:text-darkTextSecondary">
            You&apos;re subscribing to{" "}
            <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
              {plan.name}
            </span>
            . One seat per person who tracks time — you can add more later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label
            htmlFor="checkout-seats"
            className="block text-sm font-medium text-headingTextColor dark:text-darkTextPrimary"
          >
            Number of users
          </label>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Remove a seat"
              disabled={effective <= floor}
              onClick={() => nudge(-1)}
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-borderColor text-subTextColor transition-colors hover:text-headingTextColor disabled:pointer-events-none disabled:opacity-40 dark:border-darkBorder dark:text-darkTextSecondary dark:hover:text-darkTextPrimary"
            >
              <Minus className="size-4" />
            </button>

            <div className="relative flex-1">
              <Users className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subTextColor dark:text-darkTextSecondary" />
              <Input
                id="checkout-seats"
                inputMode="numeric"
                value={seats}
                onChange={(event) =>
                  // Digits only — a stray letter would read as NaN and silently
                  // disable Continue with nothing on screen explaining why.
                  setSeats(event.target.value.replace(/[^\d]/g, ""))
                }
                // Select-all on the FIRST click so typing replaces the default
                // (a click focuses, which selects, and then places the caret —
                // which would wipe that selection, so the first mouseup is
                // suppressed too).
                //
                // Only the first: suppressing every mouseup left the field
                // feeling read-only, because clicking into it to fix one digit
                // could no longer move the caret. After that first entry it
                // behaves like any other input again.
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
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submit();
                  }
                }}
                aria-invalid={!valid && seats.length > 0}
                className="h-11 pl-9 text-center text-base font-semibold dark:border-darkBorder dark:bg-darkPrimaryBg"
              />
            </div>

            <button
              type="button"
              aria-label="Add a seat"
              disabled={effective >= ceiling}
              onClick={() => nudge(1)}
              className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-borderColor text-subTextColor transition-colors hover:text-headingTextColor disabled:pointer-events-none disabled:opacity-40 dark:border-darkBorder dark:text-darkTextSecondary dark:hover:text-darkTextPrimary"
            >
              <Plus className="size-4" />
            </button>
          </div>

          {!valid && seats.length > 0 ? (
            <p className="text-sm text-red-600 dark:text-red-400">
              {parsed < floor
                ? `You have ${floor} active ${floor === 1 ? "member" : "members"}, so you need at least ${floor} ${floor === 1 ? "seat" : "seats"}.`
                : `Please enter a number between ${floor} and ${ceiling}.`}
            </p>
          ) : (
            <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
              Defaults to your {floor} active{" "}
              {floor === 1 ? "member" : "members"}. Add seats now for people
              you&apos;re about to invite.
            </p>
          )}

          {/* An estimate, and labelled as one. The authoritative total — with
              discount and tax — is computed server-side on the next screen, and
              this must never look like it is competing with it. */}
          {seatPrice !== null && valid && (
            <p className="rounded-lg bg-bgSecondary px-3 py-2.5 text-sm text-subTextColor dark:bg-darkTertiaryBg dark:text-darkTextSecondary">
              Estimated{" "}
              <span className="font-semibold text-headingTextColor dark:text-darkTextPrimary">
                {formatDollars(seatPrice * parsed)}
              </span>{" "}
              per {CYCLE_PERIOD_NOUN[cycle]} — before any discount or tax.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline2"
            onClick={() => onOpenChange(false)}
            disabled={navigating}
          >
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={!valid || navigating}>
            Continue to payment
            <ArrowRight className="size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
