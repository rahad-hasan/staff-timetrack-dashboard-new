"use client";

import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createRefundRequest, getRefundEligibility } from "@/actions/billing/refundAction";
import { useBillingRefresh } from "@/components/Billing/useBillingRefresh";
import { formatCents } from "@/lib/billing";
import {
  dollarsToCents,
  REFUND_AMOUNT_PATTERN,
  REFUND_BLOCKED_COPY,
  REFUND_REASON_LABELS,
  REFUND_REASON_VALUES,
} from "@/lib/refund";
import type { IRefundEligibility } from "@/types/billing";

const REASON_MAX = 1000;

const refundFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .regex(REFUND_AMOUNT_PATTERN, "Enter a valid amount (up to 2 decimals)")
    .refine((value) => dollarsToCents(value) > 0, "Amount must be greater than zero"),
  reason_code: z.enum(REFUND_REASON_VALUES, { message: "Choose a reason" }),
  reason: z
    .string()
    .trim()
    .min(10, "Tell us a little more (at least 10 characters)")
    .max(REASON_MAX, `Keep it under ${REASON_MAX} characters`),
});

type RefundFormValues = z.infer<typeof refundFormSchema>;

type RequestRefundDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: number;
  invoiceNumber: string;
};

/**
 * Asks the billing team for a refund on one invoice. Eligibility is fetched on
 * every open (the refundable amount can change while the page sits open), the
 * amount ceiling is checked against it before submitting, and the server
 * checks it again under a lock — this dialog is a convenience, not the guard.
 */
export default function RequestRefundDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
}: RequestRefundDialogProps) {
  const refreshBilling = useBillingRefresh();
  const [eligibility, setEligibility] = useState<IRefundEligibility | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A ref, not state: two clicks in one frame both see `submitting === false`.
  const submittingRef = useRef(false);
  const latestRequest = useRef(0);

  const form = useForm<RefundFormValues>({
    resolver: zodResolver(refundFormSchema),
    defaultValues: { amount: "", reason: "" },
  });
  const watchedAmount = form.watch("amount");
  // The usual SaaS rule, said up front: giving back all of this period's
  // payment ends the subscription for this period.
  const endsSubscription =
    Boolean(eligibility?.cancels_subscription_when_full) &&
    dollarsToCents(watchedAmount ?? "") >= (eligibility?.available_cents ?? Number.POSITIVE_INFINITY);

  useEffect(() => {
    if (!open) return;

    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;
    form.reset({ amount: "", reason: "" });

    const load = async () => {
      setEligibility(null);
      setError(null);
      setChecking(true);

      try {
        const response = await getRefundEligibility(invoiceId);
        if (latestRequest.current !== requestId) return;

        if (response?.success && response.data) {
          setEligibility(response.data);
          if (response.data.can_request) {
            form.setValue("amount", (response.data.available_cents / 100).toFixed(2));
          }
        } else {
          setError(response?.message || "Could not check this invoice.");
        }
      } catch {
        if (latestRequest.current === requestId) setError("Could not check this invoice.");
      } finally {
        if (latestRequest.current === requestId) setChecking(false);
      }
    };

    void load();
  }, [open, invoiceId, form]);

  const handleOpenChange = (next: boolean) => {
    if (submittingRef.current) return;
    onOpenChange(next);
  };

  const handleSubmit = async (values: RefundFormValues) => {
    if (submittingRef.current || !eligibility) return;

    const amountCents = dollarsToCents(values.amount);
    if (amountCents > eligibility.available_cents) {
      form.setError("amount", {
        message: `You can request at most ${formatCents(eligibility.available_cents, eligibility.currency)}`,
      });
      return;
    }

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);

    try {
      const response = await createRefundRequest({
        invoice_id: invoiceId,
        amount_cents: amountCents,
        reason_code: values.reason_code,
        reason: values.reason.trim(),
      });

      if (response?.success) {
        toast.success("Refund request sent. We'll notify you once it's reviewed.");
        onOpenChange(false);
        await refreshBilling();
        return;
      }

      setError(response?.message || "Could not send the refund request.");
    } catch {
      setError("Something went wrong while sending the request.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const currency = eligibility?.currency ?? "usd";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-full max-w-[calc(100vw-1rem)] sm:max-w-[520px] dark:bg-darkSecondaryBg"
        onInteractOutside={(event) => {
          if (submitting) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (submitting) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Request a refund</DialogTitle>
          <DialogDescription>
            Invoice {invoiceNumber}. Our billing team reviews every request and
            you will be notified of the outcome.
          </DialogDescription>
        </DialogHeader>

        {checking && (
          <div
            className="flex items-center gap-2 py-8 text-sm text-subTextColor dark:text-darkTextSecondary"
            role="status"
          >
            <Loader2 className="size-4 animate-spin" /> Checking this invoice…
          </div>
        )}

        {!checking && eligibility && !eligibility.can_request && (
          <p className="rounded-md bg-orange-50 px-3 py-2 text-sm text-orange-700 dark:bg-orange-500/10 dark:text-orange-300">
            {REFUND_BLOCKED_COPY[eligibility.blocked_reason ?? "not_paid"](eligibility)}
          </p>
        )}

        {!checking && eligibility?.can_request && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" noValidate>
              <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                Paid {formatCents(eligibility.paid_cents, currency)}
                {eligibility.refunded_cents > 0 &&
                  ` · already refunded ${formatCents(eligibility.refunded_cents, currency)}`}
                {" · "}refundable {formatCents(eligibility.available_cents, currency)}
              </p>

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Amount ({currency.toUpperCase()})</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="0.00"
                        disabled={submitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Reason</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={submitting}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Choose a reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REFUND_REASON_VALUES.map((value) => (
                          <SelectItem key={value} value={value}>
                            {REFUND_REASON_LABELS[value]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Details</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        maxLength={REASON_MAX}
                        disabled={submitting}
                        className="min-h-[110px] dark:border-darkBorder dark:bg-darkPrimaryBg"
                        placeholder="What happened? This helps us review the request quickly."
                      />
                    </FormControl>
                    <div className="flex items-start justify-between gap-2">
                      <FormMessage />
                      <span className="ml-auto shrink-0 text-xs text-subTextColor dark:text-darkTextSecondary">
                        {field.value.length}/{REASON_MAX}
                      </span>
                    </div>
                  </FormItem>
                )}
              />

              {endsSubscription && (
                <p
                  role="note"
                  className="rounded-md bg-orange-50 px-3 py-2 text-sm text-orange-700 dark:bg-orange-500/10 dark:text-orange-300"
                >
                  A full refund of your current billing period ends your subscription once it is
                  processed: tracking stops and you will need to choose a plan again. Request a
                  smaller amount to keep using the app.
                </p>
              )}

              {error && (
                <p
                  role="alert"
                  className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300"
                >
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-borderColor pt-5 sm:flex-row sm:justify-end dark:border-darkBorder">
                <Button
                  type="button"
                  variant="outline2"
                  onClick={() => handleOpenChange(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Sending
                    </>
                  ) : (
                    "Send request"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}

        {!checking && !eligibility && error && (
          <p
            role="alert"
            className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300"
          >
            {error}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
