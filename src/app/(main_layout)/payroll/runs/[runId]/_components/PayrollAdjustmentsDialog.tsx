"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import z from "zod";
import { AlertTriangle, Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { savePayrollAdjustments } from "@/actions/payroll/action";
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
import { Switch } from "@/components/ui/switch";
import {
  PAYROLL_ADJUSTMENT_LIMITS,
  formatPayrollMoney,
  resolveAdjustmentError,
  splitAdjustments,
} from "@/lib/payroll";
import { EmployeePayroll, PayrollAdjustment } from "@/types/payroll";
import { payrollAdjustmentsFormSchema } from "@/zod/schema";

/** `amount` stays a string through the form; it is converted only on submit. */
type AdjustmentsFormValues = z.infer<typeof payrollAdjustmentsFormSchema>;

interface PayrollAdjustmentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runId: number;
  item: EmployeePayroll | null;
  /** Saved successfully — the parent refetches. */
  onSaved: () => void;
  /** The run moved on under us (locked / gone / forbidden) — close and refetch. */
  onRunStale: () => void;
}

const buildDefaultValues = (
  item: EmployeePayroll | null,
): AdjustmentsFormValues => {
  if (!item) return { waive_deduction: false, bonuses: [] };

  const { appliedBonuses } = splitAdjustments(item);

  return {
    waive_deduction: !!item.deduction_waived,
    bonuses: appliedBonuses.map((line) => ({
      title: line.title,
      amount: String(line.amount),
    })),
  };
};

const PayrollAdjustmentsDialog = ({
  open,
  onOpenChange,
  runId,
  item,
  onSaved,
  onRunStale,
}: PayrollAdjustmentsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [retryable, setRetryable] = useState(false);
  const [ackStale, setAckStale] = useState(false);

  const form = useForm<AdjustmentsFormValues>({
    resolver: zodResolver(payrollAdjustmentsFormSchema),
    defaultValues: buildDefaultValues(item),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bonuses",
  });

  useEffect(() => {
    if (open) {
      form.reset(buildDefaultValues(item));
      setRetryable(false);
      setAckStale(false);
    }
  }, [open, item, form]);

  const values = form.watch();

  const staleBonuses = useMemo(
    () => (item ? splitAdjustments(item).staleBonuses : []),
    [item],
  );

  // Mirrors the server formula: gross_salary is already net of the deduction,
  // so waiving adds it straight back. Half-typed rows contribute 0, not NaN.
  const previewFinal = useMemo(() => {
    if (!item) return 0;
    const gross = Number(item.gross_salary || 0);
    const waived = values.waive_deduction
      ? Number(item.deduction_amount || 0)
      : 0;
    const bonusTotal = (values.bonuses ?? []).reduce((sum, bonus) => {
      const amount = Number(bonus?.amount);
      return Number.isFinite(amount) && amount > 0 ? sum + amount : sum;
    }, 0);
    return gross + waived + bonusTotal;
  }, [item, values]);

  // `item` is nulled by the parent as the dialog closes; the content is guarded
  // inside DialogContent (as MyPayslipsView does) so the exit animation survives.
  const currency = item?.currency ?? "";
  const atLimit = fields.length >= PAYROLL_ADJUSTMENT_LIMITS.MAX_BONUSES;
  const hasDeduction = Number(item?.deduction_amount || 0) > 0;
  const blockedByStale = staleBonuses.length > 0 && !ackStale;

  // Only called from the Re-enter button, which is already disabled at the
  // limit. The amount is deliberately blanked: re-sending it would stamp an
  // old currency's figure with the employee's new one.
  const reEnterStale = (line: PayrollAdjustment) => {
    append({ title: line.title, amount: "" });
  };

  const handleSubmit = async (payload: AdjustmentsFormValues) => {
    // blockedByStale guards every submit path, not just the Save button.
    if (!item || blockedByStale) return;
    setLoading(true);
    setRetryable(false);

    let response: Awaited<ReturnType<typeof savePayrollAdjustments>>;

    try {
      response = await savePayrollAdjustments(runId, item.user_id, {
        waive_deduction: payload.waive_deduction,
        bonuses: payload.bonuses.map((bonus) => ({
          title: bonus.title.trim(),
          // Safe: the schema's regex guarantees a plain decimal string.
          amount: Number(bonus.amount),
        })),
      });
    } catch {
      // The Server Action RPC itself failed — the browser went offline, or a
      // redeploy invalidated the action id. The action's own try/catch only
      // covers server-side execution. react-hook-form re-throws from
      // handleSubmit, so without this the rejection escapes unhandled and the
      // user sees nothing at all. Retrying is safe: the endpoint is a REPLACE.
      toast.error("Couldn't reach the payroll service. Please try again.");
      setRetryable(true);
      setLoading(false);
      return;
    }

    try {
      if (response?.success) {
        toast.success(response.message ?? "Payroll adjustments saved.");
        onSaved();
        onOpenChange(false);
        return;
      }

      const { kind, message } = resolveAdjustmentError(response);

      if (kind === "validation") {
        toast.error(response?.errorMessages?.[0]?.message ?? message);
      } else {
        toast.error(message);
      }

      switch (kind) {
        case "locked":
        case "not_found":
        case "forbidden":
          onOpenChange(false);
          onRunStale();
          break;
        case "conflict":
        case "network":
          // Keep the dialog open with the form intact so Retry re-sends the
          // identical body — safe because the endpoint is a REPLACE.
          setRetryable(true);
          break;
        default:
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const submit = form.handleSubmit(handleSubmit);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[95vh] w-full max-w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-[720px] dark:bg-darkSecondaryBg"
        onInteractOutside={(event) => {
          if (loading) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (loading) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Adjust payroll</DialogTitle>
          <DialogDescription>
            {item
              ? `Waive this month's deduction or add bonuses for ${
                  item.user?.name ?? `user #${item.user_id}`
                }. Amounts are in ${currency}, the employee's payroll currency.`
              : "Waive this month's deduction or add bonuses."}
          </DialogDescription>
        </DialogHeader>

        {item ? (
        <Form {...form}>
          <form onSubmit={submit} className="mt-4 space-y-5">
            {staleBonuses.length > 0 ? (
              <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-300" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      {staleBonuses.length} bonus line
                      {staleBonuses.length === 1 ? " is" : "s are"} not applied
                    </p>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      This employee&apos;s payroll currency changed, so{" "}
                      {staleBonuses.length === 1 ? "it was" : "they were"}{" "}
                      skipped on the last regenerate and{" "}
                      {staleBonuses.length === 1 ? "is" : "are"} not in their
                      final salary. Saving removes{" "}
                      {staleBonuses.length === 1 ? "it" : "them"}. Re-enter
                      anything you still want in {currency}.
                    </p>

                    <ul className="mt-3 space-y-2">
                      {staleBonuses.map((line) => (
                        <li
                          key={line.id}
                          className="flex items-center justify-between gap-3 rounded-[6px] border border-amber-200/70 bg-white/60 px-3 py-2 dark:border-amber-800/70 dark:bg-darkPrimaryBg/40"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm text-subTextColor dark:text-darkTextSecondary">
                              {line.title}
                            </p>
                            <p className="text-xs text-subTextColor/80 dark:text-darkTextSecondary/80">
                              {formatPayrollMoney(line.amount, line.currency)} ·
                              not applied
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline2"
                            size="sm"
                            disabled={loading || atLimit}
                            onClick={() => reEnterStale(line)}
                          >
                            <RotateCcw className="size-3.5" />
                            Re-enter
                          </Button>
                        </li>
                      ))}
                    </ul>

                    <label className="mt-3 flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={ackStale}
                        onChange={(event) => setAckStale(event.target.checked)}
                        disabled={loading}
                        className="mt-0.5 size-4 accent-amber-600"
                      />
                      <span className="text-xs text-amber-800 dark:text-amber-200">
                        I understand these lines will be removed when I save.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-[8px] border border-borderColor p-4 dark:border-darkBorder">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                    Waive this month&apos;s deduction
                  </p>
                  <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                    {hasDeduction
                      ? `Adds back ${formatPayrollMoney(
                          item.deduction_amount,
                          currency,
                        )} deducted for the work-duration gap.`
                      : "No deduction this month — waiving is a safe no-op."}
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="waive_deduction"
                  render={({ field }) => (
                    <FormItem className="!m-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={loading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="rounded-[8px] border border-borderColor p-4 dark:border-darkBorder">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                    Bonuses
                  </p>
                  <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                    Free-text title and amount, in {currency}.
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs font-medium text-subTextColor dark:text-darkTextSecondary">
                  {fields.length}/{PAYROLL_ADJUSTMENT_LIMITS.MAX_BONUSES}
                </span>
              </div>

              {fields.length === 0 ? (
                <p className="rounded-[6px] border border-dashed border-borderColor px-3 py-4 text-center text-xs text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary">
                  No bonuses for this employee.
                </p>
              ) : (
                <ul className="space-y-3">
                  {fields.map((field, index) => (
                    <li
                      key={field.id}
                      className="flex flex-col gap-3 sm:flex-row sm:items-start"
                    >
                      <FormField
                        control={form.control}
                        name={`bonuses.${index}.title`}
                        render={({ field: titleField }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-xs">Title</FormLabel>
                            <FormControl>
                              <Input
                                {...titleField}
                                maxLength={PAYROLL_ADJUSTMENT_LIMITS.MAX_TITLE}
                                placeholder="e.g. Eid bonus"
                                disabled={loading}
                                className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`bonuses.${index}.amount`}
                        render={({ field: amountField }) => (
                          <FormItem className="sm:w-[190px]">
                            <FormLabel className="text-xs">
                              Amount ({currency})
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  {...amountField}
                                  inputMode="decimal"
                                  placeholder="0.00"
                                  disabled={loading}
                                  className="pr-14 dark:border-darkBorder dark:bg-darkPrimaryBg"
                                />
                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-subTextColor dark:text-darkTextSecondary">
                                  {currency}
                                </span>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={loading}
                        aria-label={`Remove bonus ${index + 1}`}
                        onClick={() => remove(index)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 sm:mt-[26px] dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <Button
                type="button"
                variant="outline2"
                size="sm"
                className="mt-3"
                disabled={loading || atLimit}
                onClick={() => append({ title: "", amount: "" })}
              >
                <Plus className="size-4" />
                Add bonus
              </Button>
              {atLimit ? (
                <p className="mt-2 text-xs text-subTextColor dark:text-darkTextSecondary">
                  You&apos;ve reached the maximum of{" "}
                  {PAYROLL_ADJUSTMENT_LIMITS.MAX_BONUSES} bonus lines.
                </p>
              ) : null}
            </div>

            <div className="rounded-[8px] border border-borderColor bg-bgSecondary/50 p-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-subTextColor dark:text-darkTextSecondary">
                  Current final
                </span>
                <span className="text-headingTextColor dark:text-darkTextPrimary">
                  {formatPayrollMoney(item.final_salary, currency)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-borderColor pt-2 dark:border-darkBorder">
                <span className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                  Estimated new final
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatPayrollMoney(previewFinal, currency)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-subTextColor dark:text-darkTextSecondary">
                Confirmed by the server on save.
              </p>
            </div>

            {retryable ? (
              <div className="flex items-start gap-3 rounded-[8px] border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-300" />
                <div className="flex-1">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    We couldn&apos;t confirm the save. Your changes are still
                    here — retrying is safe.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline2"
                    className="mt-2"
                    disabled={loading || blockedByStale}
                    onClick={submit}
                  >
                    <RotateCcw className="size-3.5" />
                    Retry
                  </Button>
                  {blockedByStale ? (
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
                      Re-confirm the removal above to retry.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
              Saving replaces all adjustments for this employee —{" "}
              {fields.length} bonus line{fields.length === 1 ? "" : "s"}
              {values.waive_deduction ? ", deduction waived" : ""}.
            </p>

            <div className="flex flex-col-reverse gap-3 border-t border-borderColor pt-5 sm:flex-row sm:justify-end dark:border-darkBorder">
              <Button
                type="button"
                variant="outline2"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || blockedByStale}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  "Save adjustments"
                )}
              </Button>
            </div>
          </form>
        </Form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default PayrollAdjustmentsDialog;
