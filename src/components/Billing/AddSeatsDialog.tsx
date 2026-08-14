"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addSeats, getSeatQuote } from "@/actions/billing/action";
import { formatBillingDate, formatCents } from "@/lib/billing";
import { useBillingStore } from "@/store/billingStore";
import { IAddSeatsResult, ISeatQuote } from "@/types/billing";
import PendingInvoiceNotice from "./PendingInvoiceNotice";
import { useBillingRefresh } from "./useBillingRefresh";

type Step = "input" | "review" | "pending";

/**
 * Globally mounted Add-seats dialog (guide §3), controlled by the billing
 * store so any surface hitting the seat cap can open it. ALWAYS two steps:
 * quote (read-only preview, no charge) → confirm. The frontend never computes
 * proration — every amount shown is a server number via formatCents.
 */
export default function AddSeatsDialog() {
  const open = useBillingStore((s) => s.addSeatsOpen);
  const closeAddSeats = useBillingStore((s) => s.closeAddSeats);
  const refreshBilling = useBillingRefresh();
  const startPolling = useBillingStore((s) => s.startPolling);
  const stopPolling = useBillingStore((s) => s.stopPolling);
  const seatLimit = useBillingStore(
    (s) => s.status?.entitlements?.seat_limit,
  );

  const [step, setStep] = useState<Step>("input");
  const [seats, setSeats] = useState(1);
  const [quote, setQuote] = useState<ISeatQuote | null>(null);
  const [pendingResult, setPendingResult] = useState<IAddSeatsResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const appliedNotifiedRef = useRef(false);
  /* Bumped on every (re)open — in-flight responses from a previous session
     compare against it and discard themselves, so closing mid-request can
     never leave a stale quote/step behind (the dialog is globally mounted and
     its state survives Radix close). */
  const sessionRef = useRef(0);

  /* Reset state fully whenever the dialog (re)opens. Resetting on open rather
     than close means anything a late response wrote while closed is wiped
     before it can be seen. Polling release is handled by the pending-step
     effect's cleanup — no unmatched stopPolling here (the poll timer is
     shared and reference-counted). */
  useEffect(() => {
    if (open) {
      sessionRef.current += 1;
      setStep("input");
      setSeats(1);
      setQuote(null);
      setPendingResult(null);
      setError(null);
      setQuoting(false);
      setConfirming(false);
      appliedNotifiedRef.current = false;
    }
  }, [open]);

  /* Poll billing status (5s) while the pending-payment notice is shown. */
  useEffect(() => {
    if (open && step === "pending") {
      startPolling(5000);
      return () => stopPolling();
    }
  }, [open, step, startPolling, stopPolling]);

  /* Seats apply automatically once the invoice is paid (webhook): when the
     polled status shows the seat limit grew to the quoted total, celebrate
     and close. */
  useEffect(() => {
    if (step !== "pending" || !pendingResult) return;
    const target = pendingResult.quote?.seats_after;
    if (
      !appliedNotifiedRef.current &&
      typeof target === "number" &&
      typeof seatLimit === "number" &&
      seatLimit !== -1 &&
      seatLimit >= target
    ) {
      appliedNotifiedRef.current = true;
      toast.success(`${pendingResult.quote.seats_added} seat(s) added ✓`);
      // The polled status is already fresh; this is for everything the poll
      // does NOT touch — the invoice table and the server-rendered tree.
      void refreshBilling();
      closeAddSeats();
    }
  }, [step, pendingResult, seatLimit, closeAddSeats, refreshBilling]);

  const handleSeatsChange = (value: string) => {
    const parsed = parseInt(value, 10);
    setSeats(Number.isNaN(parsed) ? 1 : Math.max(1, parsed));
  };

  const handleGetQuote = async () => {
    const session = sessionRef.current;
    setError(null);
    setQuoting(true);
    try {
      const res = await getSeatQuote(seats);
      if (session !== sessionRef.current) return; // dialog was closed/reopened
      if (res?.success && res.data) {
        setQuote(res.data);
        setStep("review");
      } else {
        setError(res?.message || "Could not fetch a quote. Please try again.");
      }
    } catch {
      toast.error("Something went wrong while fetching the quote.");
    } finally {
      if (session === sessionRef.current) setQuoting(false);
    }
  };

  const handleConfirm = async () => {
    if (!quote) return;
    const session = sessionRef.current;
    setError(null);
    setConfirming(true);
    try {
      const res = await addSeats(seats);
      if (session !== sessionRef.current) return; // dialog was closed/reopened
      if (res?.success && res.data) {
        const data = res.data;
        const paidInstantly =
          data.pending_update === false &&
          (data.latest_invoice_status === "paid" ||
            quote.amount_due_cents === 0);
        if (paidInstantly) {
          toast.success(
            `${data.quote?.seats_added ?? seats} seat(s) added ✓`,
          );
          // Forced refresh, not a plain fetchStatus(): the charge already
          // happened, so a request that left before it must not be allowed to
          // answer for it. Also wakes the invoice table — the seat proration
          // invoice was just created.
          await refreshBilling();
          closeAddSeats();
        } else {
          /* pending_update === true or invoice "open" (or any other
             not-yet-applied success) → confirm-payment notice + polling. */
          setPendingResult(data);
          setStep("pending");
        }
      } else {
        setError(res?.message || "Could not add seats. Please try again.");
      }
    } catch {
      toast.error("Something went wrong while adding seats.");
    } finally {
      if (session === sessionRef.current) setConfirming(false);
    }
  };

  /* Covering range: first proration line's period when present, else the
     quote's current period (contract §13). */
  const prorationLine = quote?.lines?.find(
    (l) => l.is_proration && l.period_start && l.period_end,
  );
  const coverStart = prorationLine?.period_start ?? quote?.current_period_start;
  const coverEnd = prorationLine?.period_end ?? quote?.current_period_end;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) closeAddSeats();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-headingTextColor dark:text-darkTextPrimary">
            Add seats
          </DialogTitle>
          <DialogDescription className="text-subTextColor dark:text-darkTextSecondary">
            {step === "input" && "How many seats?"}
            {step === "review" && "Review"}
            {step === "pending" && "Confirm payment"}
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline2"
                size="icon"
                aria-label="Decrease seats"
                onClick={() => setSeats((s) => Math.max(1, s - 1))}
                disabled={seats <= 1 || quoting}
              >
                <Minus />
              </Button>
              <Input
                type="number"
                min={1}
                step={1}
                value={seats}
                onChange={(e) => handleSeatsChange(e.target.value)}
                disabled={quoting}
                className="w-24 text-center"
                aria-label="Number of seats to add"
              />
              <Button
                type="button"
                variant="outline2"
                size="icon"
                aria-label="Increase seats"
                onClick={() => setSeats((s) => s + 1)}
                disabled={quoting}
              >
                <Plus />
              </Button>
            </div>
            <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
              You&apos;ll see the exact prorated price before anything is
              charged.
            </p>
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                onClick={handleGetQuote}
                disabled={quoting || seats < 1}
              >
                {quoting && <Loader2 className="animate-spin" />}
                Get quote
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "review" && quote && (
          <>
            <p className="text-sm text-headingTextColor dark:text-darkTextPrimary">
              Adding{" "}
              <span className="font-semibold">
                {quote.seats_added} user(s)
              </span>{" "}
              costs{" "}
              <span className="font-semibold">
                {formatCents(quote.amount_due_cents, quote.currency)}
              </span>{" "}
              now, covering {formatBillingDate(coverStart)} →{" "}
              {formatBillingDate(coverEnd)} (the rest of your current billing
              period). Your renewal on{" "}
              {formatBillingDate(quote.current_period_end)} will include all{" "}
              {quote.seats_after} users.
            </p>

            <ul className="divide-y divide-borderColor rounded-lg border border-borderColor dark:divide-darkBorder dark:border-darkBorder">
              {quote.lines.map((line, index) => (
                <li
                  key={index}
                  className="flex items-start justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span className="text-subTextColor dark:text-darkTextSecondary">
                    {line.description}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-medium",
                      line.amount_cents < 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-headingTextColor dark:text-darkTextPrimary",
                    )}
                  >
                    {formatCents(line.amount_cents, quote.currency)}
                  </span>
                </li>
              ))}
            </ul>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline2"
                onClick={() => {
                  setError(null);
                  setStep("input");
                }}
                disabled={confirming}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={handleConfirm}
                disabled={confirming}
              >
                {confirming && <Loader2 className="animate-spin" />}
                Confirm &amp; pay
              </Button>
            </DialogFooter>
          </>
        )}

        {step === "pending" && pendingResult && (
          <>
            <PendingInvoiceNotice
              result={pendingResult}
              message="Almost done — confirm payment to finish adding seats."
            />
            <div className="flex items-center gap-2 text-sm text-subTextColor dark:text-darkTextSecondary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Waiting for payment confirmation…
            </div>
            <DialogFooter>
              <Button type="button" variant="outline2" onClick={closeAddSeats}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
