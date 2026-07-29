"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import z from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  createPayrollProfile,
  updatePayrollProfile,
} from "@/actions/payroll/action";
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
  FormDescription,
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
import { Switch } from "@/components/ui/switch";
import { EligibleUser, EmployeePayrollProfile } from "@/types/payroll";
import { currencies } from "@/utils/CurrencyList";
import { payrollProfileFormSchema } from "@/zod/schema";

type FormValues = z.infer<typeof payrollProfileFormSchema>;

interface PayrollProfileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  mode: "create" | "edit";
  profile: EmployeePayrollProfile | null;
  presetUser: EligibleUser | null;
  members: EligibleUser[];
  defaultCurrency: string;
}

const today = () => format(new Date(), "yyyy-MM-dd");

const toDateInputValue = (value?: string | null) => {
  if (!value) return null;
  try {
    return format(parseISO(value), "yyyy-MM-dd");
  } catch {
    return value.slice(0, 10);
  }
};

const buildDefaultValues = (
  mode: "create" | "edit",
  profile: EmployeePayrollProfile | null,
  presetUser: EligibleUser | null,
  defaultCurrency: string,
): FormValues => {
  if (mode === "edit" && profile) {
    return {
      user_id: profile.user_id,
      salary_type: profile.salary_type,
      monthly_salary: profile.monthly_salary,
      hourly_rate: profile.hourly_rate,
      overtime_allow: profile.overtime_allow,
      overtime_multiplier: profile.overtime_multiplier,
      is_deduct_salary: profile.is_deduct_salary,
      effective_from: toDateInputValue(profile.effective_from) ?? today(),
      effective_to: toDateInputValue(profile.effective_to),
      currency: profile.currency,
    };
  }

  return {
    user_id: presetUser?.id ?? 0,
    salary_type: "monthly_fixed",
    monthly_salary: 0,
    hourly_rate: 0,
    overtime_allow: true,
    overtime_multiplier: 1.5,
    is_deduct_salary: true,
    effective_from: today(),
    effective_to: null,
    currency: defaultCurrency || "USD",
  };
};

const HISTORICAL_ERROR = "cannot modify a historical profile";

const PayrollProfileFormDialog = ({
  open,
  onOpenChange,
  onSuccess,
  mode,
  profile,
  presetUser,
  members,
  defaultCurrency,
}: PayrollProfileFormDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(payrollProfileFormSchema),
    defaultValues: buildDefaultValues(mode, profile, presetUser, defaultCurrency),
  });

  useEffect(() => {
    if (open) {
      form.reset(buildDefaultValues(mode, profile, presetUser, defaultCurrency));
      setReplaceExisting(false);
    }
  }, [open, mode, profile, presetUser, defaultCurrency, form]);

  const values = form.watch();
  const isHourly = values.salary_type === "hourly";

  const selectableMembers = useMemo(() => members ?? [], [members]);

  const handleSubmit = async (payload: FormValues) => {
    setLoading(true);
    const trimmedPayload = {
      ...payload,
      monthly_salary: isHourly ? 0 : payload.monthly_salary,
      hourly_rate: isHourly ? payload.hourly_rate : 0,
      is_deduct_salary: isHourly ? false : payload.is_deduct_salary,
      effective_to: payload.effective_to ? payload.effective_to : null,
    };

    try {
      if (mode === "edit" && profile) {
        if (replaceExisting) {
          const closeResponse = await updatePayrollProfile(
            profile.id,
            { effective_to: today() },
            profile.user_id,
          );

          if (!closeResponse?.success) {
            toast.error(
              closeResponse?.message ??
                "Failed to close the existing profile.",
            );
            setLoading(false);
            return;
          }

          const nextEffectiveFrom = format(
            new Date(Date.now() + 24 * 60 * 60 * 1000),
            "yyyy-MM-dd",
          );

          const createResponse = await createPayrollProfile({
            user_id: profile.user_id,
            salary_type: trimmedPayload.salary_type,
            monthly_salary: trimmedPayload.monthly_salary,
            hourly_rate: trimmedPayload.hourly_rate,
            overtime_allow: trimmedPayload.overtime_allow,
            overtime_multiplier: trimmedPayload.overtime_multiplier,
            is_deduct_salary: trimmedPayload.is_deduct_salary,
            effective_from: nextEffectiveFrom,
            effective_to: trimmedPayload.effective_to,
            currency: trimmedPayload.currency,
          });

          if (createResponse?.success) {
            toast.success("Salary raise recorded as a new active profile.");
            onSuccess();
            onOpenChange(false);
          } else {
            toast.error(
              createResponse?.message ?? "Failed to create new profile.",
            );
          }
        } else {
          const response = await updatePayrollProfile(
            profile.id,
            {
              salary_type: trimmedPayload.salary_type,
              monthly_salary: trimmedPayload.monthly_salary,
              hourly_rate: trimmedPayload.hourly_rate,
              overtime_allow: trimmedPayload.overtime_allow,
              overtime_multiplier: trimmedPayload.overtime_multiplier,
              is_deduct_salary: trimmedPayload.is_deduct_salary,
              effective_from: trimmedPayload.effective_from,
              effective_to: trimmedPayload.effective_to,
              currency: trimmedPayload.currency,
            },
            profile.user_id,
          );

          if (response?.success) {
            toast.success(response.message ?? "Profile updated.");
            onSuccess();
            onOpenChange(false);
          } else if (
            response?.message?.toLowerCase().includes(HISTORICAL_ERROR)
          ) {
            toast.error(
              "This profile is locked because it was used by an approved run. Create a new profile instead.",
            );
          } else {
            toast.error(response?.message ?? "Failed to update profile.");
          }
        }
      } else {
        const response = await createPayrollProfile({
          user_id: trimmedPayload.user_id,
          salary_type: trimmedPayload.salary_type,
          monthly_salary: trimmedPayload.monthly_salary,
          hourly_rate: trimmedPayload.hourly_rate,
          overtime_allow: trimmedPayload.overtime_allow,
          overtime_multiplier: trimmedPayload.overtime_multiplier,
          is_deduct_salary: trimmedPayload.is_deduct_salary,
          effective_from: trimmedPayload.effective_from,
          effective_to: trimmedPayload.effective_to,
          currency: trimmedPayload.currency,
        });

        if (response?.success) {
          toast.success(response.message ?? "Payroll profile created.");
          onSuccess();
          onOpenChange(false);
        } else {
          toast.error(response?.message ?? "Failed to create profile.");
        }
      }
    } finally {
      setLoading(false);
    }
  };

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
          <DialogTitle>
            {mode === "create" ? "Add payroll profile" : "Update payroll profile"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Define a salary configuration for an employee. This profile drives every payroll calculation until you close or replace it."
              : "Adjust this profile in place, or replace it with a fresh active profile to preserve the audit trail for a salary change."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="mt-4 space-y-5"
          >
            {mode === "create" ? (
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Employee</FormLabel>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                      disabled={!!presetUser}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full dark:border-darkBorder dark:bg-darkPrimaryBg">
                          <SelectValue placeholder="Choose an employee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[280px]">
                        {selectableMembers.map((member) => (
                          <SelectItem key={member.id} value={String(member.id)}>
                            {member.name} — {member.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="rounded-[8px] border border-borderColor bg-bgSecondary/50 p-3 text-sm dark:border-darkBorder dark:bg-darkPrimaryBg">
                <p className="text-xs uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
                  Employee
                </p>
                <p className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                  {profile?.user?.name ?? `User #${profile?.user_id}`}
                </p>
                <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                  {profile?.user?.email ?? ""}
                </p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="salary_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Salary Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as FormValues["salary_type"])
                      }
                    >
                      <FormControl>
                        <SelectTrigger className="w-full dark:border-darkBorder dark:bg-darkPrimaryBg">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly_fixed">
                          Monthly Fixed
                        </SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Currency</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full dark:border-darkBorder dark:bg-darkPrimaryBg">
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[280px]">
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {!isHourly ? (
              <FormField
                control={form.control}
                name="monthly_salary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Monthly Salary</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value ?? 0}
                        onChange={(event) =>
                          field.onChange(Number(event.target.value) || 0)
                        }
                        className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                      />
                    </FormControl>
                    <FormDescription>
                      Target hours are calculated automatically each payroll run
                      using this employee&apos;s Schedule and the company&apos;s
                      weekend settings. To adjust, update the Schedule
                      assignment or Company Settings.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="hourly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Hourly Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value ?? 0}
                        onChange={(event) =>
                          field.onChange(Number(event.target.value) || 0)
                        }
                        className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="rounded-[8px] border border-borderColor p-4 dark:border-darkBorder">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                    Allow overtime
                  </p>
                  <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                    Any hours over the target attract the multiplier below.
                  </p>
                </div>
                <FormField
                  control={form.control}
                  name="overtime_allow"
                  render={({ field }) => (
                    <FormItem className="!m-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {values.overtime_allow ? (
                <FormField
                  control={form.control}
                  name="overtime_multiplier"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel required>Overtime Multiplier</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={10}
                          step="0.1"
                          value={field.value ?? 1.5}
                          onChange={(event) =>
                            field.onChange(Number(event.target.value) || 1)
                          }
                          className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                        />
                      </FormControl>
                      <FormDescription>
                        Multiplier applied to the base rate for overtime hours
                        (1 to 10).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}
            </div>

            {!isHourly ? (
              <div className="rounded-[8px] border border-borderColor p-4 dark:border-darkBorder">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                      Deduct salary on short hours
                    </p>
                    <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                      When enabled, the final salary is reduced pro-rata if the
                      employee logs fewer than target hours.
                    </p>
                  </div>
                  <FormField
                    control={form.control}
                    name="is_deduct_salary"
                    render={({ field }) => (
                      <FormItem className="!m-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ) : null}

            <div className="grid items-start gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="effective_from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Effective From</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="effective_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective To</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === ""
                              ? null
                              : event.target.value,
                          )
                        }
                        className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty for an open-ended profile.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {mode === "edit" && profile ? (
              <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={replaceExisting}
                    onChange={(event) => setReplaceExisting(event.target.checked)}
                  />
                  <span className="text-sm text-amber-800 dark:text-amber-200">
                    <span className="font-semibold">Save as a new active profile</span>
                    <span className="mt-1 block text-xs text-amber-700 dark:text-amber-300">
                      Recommended for a mid-cycle raise. Closes the current
                      profile today and creates a new one starting tomorrow to
                      preserve the audit trail.
                    </span>
                  </span>
                </label>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-borderColor pt-5 dark:border-darkBorder sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline2"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving
                  </>
                ) : mode === "create" ? (
                  "Create profile"
                ) : replaceExisting ? (
                  "Save as new profile"
                ) : (
                  "Update profile"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PayrollProfileFormDialog;
