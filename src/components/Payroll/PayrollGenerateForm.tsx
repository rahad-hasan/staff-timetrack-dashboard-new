"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import { AlertTriangle, Loader2, PlayCircle } from "lucide-react";
import { toast } from "sonner";

import {
  generatePayroll,
  listPayrollRuns,
} from "@/actions/payroll/action";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  formatPayrollPeriod,
  isRunLocked,
  monthName,
} from "@/lib/payroll";
import { PayrollRun } from "@/types/payroll";
import { PayrollRunStatusBadge } from "./PayrollBadges";
import { generatePayrollSchema } from "@/zod/schema";

type FormValues = z.infer<typeof generatePayrollSchema>;

const currentYear = new Date().getFullYear();
const months = Array.from({ length: 12 }, (_, i) => i + 1);
const years = Array.from({ length: 6 }, (_, i) => currentYear - 3 + i);

const defaultValues = (): FormValues => {
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth();
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return { month: prevMonth, year: prevYear, notes: "" };
};

const PayrollGenerateForm = () => {
  const router = useRouter();
  const [existingRun, setExistingRun] = useState<PayrollRun | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmForce, setConfirmForce] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(generatePayrollSchema),
    defaultValues: defaultValues(),
  });

  const values = form.watch();

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!values.month || !values.year) return;
      setChecking(true);
      const response = await listPayrollRuns({
        month: values.month,
        year: values.year,
      });
      if (cancelled) return;
      const runs = response?.success && Array.isArray(response.data)
        ? response.data
        : [];
      setExistingRun(runs[0] ?? null);
      setConfirmForce(false);
      setChecking(false);
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [values.month, values.year]);

  const locked = existingRun ? isRunLocked(existingRun.status) : false;
  const needsForce =
    !!existingRun && (existingRun.status === "draft" || existingRun.status === "generated");

  const submit = async (payload: FormValues) => {
    if (locked) {
      toast.error(
        `Payroll for ${formatPayrollPeriod(payload.month, payload.year)} is already ${existingRun?.status}. Generation is locked.`,
      );
      return;
    }
    if (needsForce && !confirmForce) {
      setConfirmForce(true);
      return;
    }

    setSubmitting(true);
    const response = await generatePayroll({
      month: payload.month,
      year: payload.year,
      notes: payload.notes?.trim() ? payload.notes.trim() : undefined,
      force: needsForce,
    });

    if (response?.success && response.data) {
      const skipped = response.data.failed ?? 0;
      if (skipped > 0) {
        toast.warning(
          `${response.data.generated} generated, ${skipped} skipped due to missing payroll profiles.`,
        );
      } else {
        toast.success(response.message ?? "Payroll generated successfully.");
      }
      router.push(`/payroll/runs/${response.data.payroll_run_id}`);
    } else {
      const message = response?.message ?? "Failed to generate payroll.";
      toast.error(message);
      if (
        message.toLowerCase().includes("already exists") &&
        message.toLowerCase().includes("force")
      ) {
        setConfirmForce(true);
      }
    }
    setSubmitting(false);
  };

  const periodLabel = useMemo(
    () => formatPayrollPeriod(values.month, values.year),
    [values.month, values.year],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="rounded-[12px] border border-borderColor p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Month</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full dark:border-darkBorder dark:bg-darkPrimaryBg">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month} value={String(month)}>
                            {monthName(month)}
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
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Year</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full dark:border-darkBorder dark:bg-darkPrimaryBg">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[240px]">
                        {years.map((year) => (
                          <SelectItem key={year} value={String(year)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Optional context for this payroll run (e.g. bonus month, cycle change)."
                      className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormDescription>Up to 2000 characters.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {locked ? (
              <div className="flex items-start gap-3 rounded-[8px] border border-red-200 bg-red-50 p-4 text-sm dark:border-red-800 dark:bg-red-900/20">
                <AlertTriangle className="mt-0.5 size-4 text-red-600 dark:text-red-300" />
                <div className="text-red-800 dark:text-red-200">
                  <p className="font-medium">
                    A {existingRun?.status} run already exists for {periodLabel}.
                  </p>
                  <p className="mt-1 text-xs">
                    Approved and paid runs cannot be regenerated. Open the run
                    to review its details or export the payslip.
                  </p>
                </div>
              </div>
            ) : needsForce ? (
              <div className="flex items-start gap-3 rounded-[8px] border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-900/20">
                <AlertTriangle className="mt-0.5 size-4 text-amber-600 dark:text-amber-300" />
                <div className="text-amber-800 dark:text-amber-200">
                  <p className="font-medium">
                    A {existingRun?.status} run already exists for {periodLabel}.
                  </p>
                  <p className="mt-1 text-xs">
                    Regenerating will replace it and cannot be undone.
                    {confirmForce
                      ? " Click Generate again to confirm."
                      : " Click Generate to prepare the confirmation step."}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-borderColor pt-5 dark:border-darkBorder sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline2"
                disabled={submitting}
                onClick={() => form.reset(defaultValues())}
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={submitting || locked || checking}
                className={cn(
                  needsForce && confirmForce
                    ? "bg-amber-600 text-white hover:bg-amber-500"
                    : undefined,
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Calculating salaries…
                  </>
                ) : needsForce && confirmForce ? (
                  "Yes, replace existing run"
                ) : (
                  <>
                    <PlayCircle className="size-4" />
                    Generate payroll
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <aside className="space-y-4">
        <div className="rounded-[12px] border border-borderColor p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
          <p className="text-xs uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
            Selected period
          </p>
          <p className="mt-1 text-2xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
            {periodLabel}
          </p>
          <div className="mt-4">
            {checking ? (
              <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                Checking existing runs…
              </p>
            ) : existingRun ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <PayrollRunStatusBadge status={existingRun.status} />
                  <span className="text-sm text-subTextColor dark:text-darkTextSecondary">
                    #{existingRun.id}
                  </span>
                </div>
                <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                  {existingRun.total_employees} employees ·{" "}
                  {existingRun.generated_count} generated ·{" "}
                  {existingRun.failed_count} failed
                </p>
              </div>
            ) : (
              <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                No run exists yet for this period.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-[12px] border border-borderColor p-5 text-sm text-subTextColor dark:border-darkBorder dark:bg-darkSecondaryBg dark:text-darkTextSecondary">
          <p className="font-semibold text-headingTextColor dark:text-darkTextPrimary">
            What happens next?
          </p>
          <ul className="mt-3 space-y-2">
            <li>1. Backend gathers active payroll profiles and worked hours.</li>
            <li>2. Each employee&apos;s salary is calculated with the audit snapshot.</li>
            <li>3. You&apos;ll be redirected to the run&apos;s detail page to review, approve, or export.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default PayrollGenerateForm;
