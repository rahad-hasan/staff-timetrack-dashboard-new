"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { unstable_rethrow, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, format, parseISO } from "date-fns";
import { useForm, type FieldErrors } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  createPayrollProfile,
  supersedePayrollProfile,
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
import NumberInput from "@/components/Common/NumberInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EligibleUser, EmployeePayrollProfile } from "@/types/payroll";
import { IResponse } from "@/types/type";
import { useViewerTimeZone } from "@/components/Common/ViewerTimeZone";
import { checkBeforeRefresh } from "@/hooks/useLiveRefresh";
import { actionErrorMessage } from "@/lib/actionErrors";
import { formatCalendarDate, isValidTimeZone, todayIn } from "@/lib/timezone";
import { currencies } from "@/utils/CurrencyList";
import { payrollProfileFormSchema } from "@/zod/schema";

type FormValues = z.infer<typeof payrollProfileFormSchema>;

interface PayrollProfileFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  profile: EmployeePayrollProfile | null;
  presetUser: EligibleUser | null;
  members: EligibleUser[];
  defaultCurrency: string;
  /**
   * The company's IANA zone: the calendar the API decides a profile's dates
   * on. Without a usable one (its read failed) the viewer's zone stands in.
   */
  companyTimeZone?: string | null;
}

/**
 * Today on the dialog's calendar (the company's: see `companyTimeZone`), as a
 * date input's `yyyy-MM-dd`. `new Date()` was the browser's day, which is
 * another date whenever the browser's zone and that one put "now" on
 * different days.
 */
const today = (timeZone: string) => todayIn(timeZone);

/**
 * That calendar's tomorrow, by calendar day: adding 24 hours repeats or skips
 * a date across a daylight-saving change.
 */
const tomorrow = (timeZone: string) =>
  format(addDays(parseISO(todayIn(timeZone)), 1), "yyyy-MM-dd");

/**
 * A profile's calendar date as a date input's `yyyy-MM-dd`: the date part of
 * the API value, with no zone conversion.
 *
 * `effective_from` / `effective_to` are `@db.Date` columns. The API sends them
 * as "2026-12-31" or as that day's UTC midnight, "2026-12-31T00:00:00.000Z",
 * and either way the date part IS the date. Reading the timestamp as an
 * instant and formatting it in the browser's zone moved it a day back west of
 * UTC ("2026-12-30" in New York), and every in-place edit then saved the
 * shifted dates.
 */
const toDateInputValue = (value?: string | null) => {
  if (!value) return null;
  return /^\d{4}-\d{2}-\d{2}/.exec(value)?.[0] ?? null;
};

const CHANGE_PAY_HINT =
  "To change pay from tomorrow, edit the employee's current profile or use Add payroll profile.";

/**
 * Why `profile` can't be replaced by a new active profile starting tomorrow
 * (the API's supersede rules), or null when it can: it must be active, already
 * started, and still running tomorrow.
 */
const replaceBlocker = (
  profile: EmployeePayrollProfile,
  timeZone: string,
): string | null => {
  const next = tomorrow(timeZone);
  const from = toDateInputValue(profile.effective_from);
  const to = toDateInputValue(profile.effective_to);

  if (!profile.is_active) {
    return `This profile is inactive, so it can't be replaced. ${CHANGE_PAY_HINT}`;
  }
  if (from && from >= next) {
    return `This profile starts on ${formatCalendarDate(from)}, so there is nothing to replace yet. Update it in place instead.`;
  }
  if (to && to < next) {
    return `This profile ends on ${formatCalendarDate(to)}, so there is nothing to replace. ${CHANGE_PAY_HINT}`;
  }
  return null;
};

const buildDefaultValues = (
  mode: "create" | "edit",
  profile: EmployeePayrollProfile | null,
  presetUser: EligibleUser | null,
  defaultCurrency: string,
  timeZone: string,
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
      effective_from: toDateInputValue(profile.effective_from) ?? today(timeZone),
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
    effective_from: today(timeZone),
    effective_to: null,
    currency: defaultCurrency || "USD",
  };
};

const HISTORICAL_ERROR = "cannot modify a historical profile";

const RAISE_NOT_SAVED = "Salary raise not saved, nothing changed.";

/**
 * The API's refusal of a raise for a profile that another active profile
 * already follows: an earlier raise landed, maybe this dialog's own first
 * attempt whose answer was lost. `details.successor_starts_on`: yyyy-MM-dd.
 */
const ALREADY_SUPERSEDED = "PROFILE_ALREADY_SUPERSEDED";

/** Refusals that a change made since the list was loaded can explain. */
const STALE_LIST_STATUSES = new Set([400, 404, 409]);

type RaiseFailure =
  | (IResponse<unknown> & {
      code?: string;
      details?: { successor_starts_on?: string };
    })
  | null;

/**
 * What a failed raise means. The supersede is one transaction on the API, so
 * when the API answered — a refusal (4xx), or its own JSON error (5xx) —
 * nothing was saved by it. No answer from it (the network, a gateway's own
 * error page, an action call that threw: `null`) proves nothing either way;
 * saving again is then safe, because the API refuses a raise that already
 * went through. That refusal is coded, and never reads "not saved": the raise
 * that went through may be this one.
 *
 * `reload`: a refusal that a change made since the list was loaded can explain
 * (another admin's raise, a removed employee) reloads the list, to show it.
 * Never a 429, 403 or 5xx, nor without an answer: those say nothing about the
 * list, and its reads would likely fail too.
 */
const describeRaiseFailure = (
  response: RaiseFailure,
): { message: string; reload: boolean } => {
  const status = response?.statusCode;
  if (response?.code === ALREADY_SUPERSEDED) {
    const starts = formatCalendarDate(response.details?.successor_starts_on, "MMM d, yyyy", "");
    return {
      message: `This profile was already replaced${starts ? ` by the one starting ${starts}` : ""} in an earlier save (yours or another admin's), so this save changed nothing. Check the new profile in the list.`,
      reload: true,
    };
  }
  if (typeof status === "number" && status < 500) {
    return {
      message: `${RAISE_NOT_SAVED} ${response?.message ?? ""}`.trim(),
      reload: STALE_LIST_STATUSES.has(status),
    };
  }
  return {
    message:
      typeof status === "number" && Array.isArray(response?.errorMessages)
        ? `${RAISE_NOT_SAVED} Please try again.`
        : "We couldn't confirm the salary raise. Reload the page to check, or save again: a raise that already went through is refused, not applied twice.",
    reload: false,
  };
};

const PayrollProfileFormDialog = ({
  open,
  onOpenChange,
  mode,
  profile,
  presetUser,
  members,
  defaultCurrency,
  companyTimeZone,
}: PayrollProfileFormDialogProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const viewerTimeZone = useViewerTimeZone();
  // The API decides a raise, and which profiles are history, on the COMPANY's
  // calendar. On the viewer's, an admin in another zone was offered a start
  // the API refuses, or one a day off the company's: a month early on the
  // company's last day of a month.
  const timeZone =
    companyTimeZone && isValidTimeZone(companyTimeZone)
      ? companyTimeZone
      : viewerTimeZone;
  // "Deduct salary on short hours" as it stood when the type last left
  // Monthly Fixed, to put back on the way back; null while nothing is held.
  const deductBeforeHourlyRef = useRef<boolean | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(payrollProfileFormSchema),
    defaultValues: buildDefaultValues(mode, profile, presetUser, defaultCurrency, timeZone),
  });

  // What an opening form starts from, read through a ref: both now come from
  // the company read, which can fail on a later render of the board (a refresh
  // behind the dialog) and fall back. As dependencies of the reset below, that
  // would wipe a form someone is typing in.
  const startRef = useRef({ defaultCurrency, timeZone });
  startRef.current = { defaultCurrency, timeZone };

  useEffect(() => {
    if (open) {
      const start = startRef.current;
      form.reset(
        buildDefaultValues(mode, profile, presetUser, start.defaultCurrency, start.timeZone),
      );
      setReplaceExisting(false);
      deductBeforeHourlyRef.current = null;
    }
  }, [open, mode, profile, presetUser, form]);

  const values = form.watch();
  const isHourly = values.salary_type === "hourly";
  // Only ever computed client-side: an edit opens on a click, never in SSR.
  const replaceBlockedBy =
    mode === "edit" && profile ? replaceBlocker(profile, timeZone) : null;

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
          const nextEffectiveFrom = tomorrow(timeZone);

          // The API refuses this as well; checked here so the error lands on
          // the field.
          if (
            trimmedPayload.effective_to &&
            trimmedPayload.effective_to < nextEffectiveFrom
          ) {
            form.setError("effective_to", {
              type: "manual",
              message: `The new profile starts ${formatCalendarDate(nextEffectiveFrom)}; its end date can't be earlier.`,
            });
            return;
          }

          // One transaction on the API: the current profile ends today (the
          // day before the successor starts) and the successor is created —
          // both or neither, so a failure leaves the employee covered.
          const response = await supersedePayrollProfile(profile.id, {
            salary_type: trimmedPayload.salary_type,
            monthly_salary: trimmedPayload.monthly_salary,
            hourly_rate: trimmedPayload.hourly_rate,
            overtime_allow: trimmedPayload.overtime_allow,
            overtime_multiplier: trimmedPayload.overtime_multiplier,
            is_deduct_salary: trimmedPayload.is_deduct_salary,
            effective_from: nextEffectiveFrom,
            effective_to: trimmedPayload.effective_to,
            currency: trimmedPayload.currency,
          }).catch((error: unknown) => {
            // Only Next's own redirects (an expired session) go on through.
            unstable_rethrow(error);
            return null;
          });

          if (response?.success) {
            toast.success("Salary raise recorded as a new active profile.");
            onOpenChange(false);
          } else {
            // The dialog stays open with its inputs: a refusal can often be
            // fixed here (an end date before the next profile starts).
            const failure = describeRaiseFailure(response);
            toast.error(failure.message, { duration: 10000 });
            if (failure.reload) {
              // Behind an open dialog, so only after the check live refresh
              // makes: a refresh that cannot land makes Next reload the whole
              // page, typed raise and all.
              void checkBeforeRefresh().then((verdict) => {
                if (verdict === "refresh") router.refresh();
              });
            }
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
          onOpenChange(false);
        } else {
          toast.error(response?.message ?? "Failed to create profile.");
        }
      }
    } catch (error) {
      // The action call itself failed (offline, or an action id from before a
      // deploy): react-hook-form rethrows it from handleSubmit, so without
      // this nothing was shown at all. The dialog keeps its inputs.
      toast.error(
        actionErrorMessage(
          error,
          mode === "edit"
            ? "Failed to update profile."
            : "Failed to create profile.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * A value can fail the schema from a field that is not on screen — the
   * branch of the other salary type, the multiplier with overtime off — or
   * from one with no message slot. Its error has nowhere to show, so Save did
   * nothing with no reason given. Say the first such error instead.
   */
  const handleInvalid = (errors: FieldErrors<FormValues>) => {
    const offScreen: Array<keyof FormValues> = [
      isHourly ? "monthly_salary" : "hourly_rate",
      "is_deduct_salary",
      "overtime_allow",
    ];
    if (!values.overtime_allow) offScreen.push("overtime_multiplier");
    if (mode !== "create") offScreen.push("user_id");

    const message = offScreen
      .map((name) => errors[name]?.message)
      .find((text) => typeof text === "string" && text);
    if (message) toast.error(message);
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
            onSubmit={form.handleSubmit(handleSubmit, handleInvalid)}
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
                      onValueChange={(value) => {
                        const next = value as FormValues["salary_type"];
                        const previous = form.getValues("salary_type");
                        field.onChange(next);
                        // The branch being hidden keeps whatever it held, and an
                        // empty box holds NaN. That still fails the schema, but
                        // from behind an unmounted <FormMessage /> — Save would
                        // do nothing with no error on screen. Retire it at a
                        // valid 0, and only when it is actually unusable, so a
                        // rate the user typed survives a round trip.
                        const hidden =
                          next === "hourly" ? "monthly_salary" : "hourly_rate";

                        if (!Number.isFinite(form.getValues(hidden))) {
                          form.setValue(hidden, 0);
                          form.clearErrors(hidden);
                        }

                        // Same trap for the deduction switch, which Hourly
                        // hides: the schema refuses hourly with deduction on,
                        // and a new profile starts with it on. Off while
                        // hourly (what Save sends for hourly anyway), and back
                        // as it stood on returning to Monthly Fixed.
                        if (next === previous) return;
                        if (next === "hourly") {
                          deductBeforeHourlyRef.current =
                            form.getValues("is_deduct_salary");
                          form.setValue("is_deduct_salary", false);
                          form.clearErrors("is_deduct_salary");
                        } else if (deductBeforeHourlyRef.current !== null) {
                          form.setValue(
                            "is_deduct_salary",
                            deductBeforeHourlyRef.current,
                          );
                          deductBeforeHourlyRef.current = null;
                        }
                      }}
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
                      <NumberInput
                        min={0}
                        step="0.01"
                        className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                        {...field}
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
                      <NumberInput
                        min={0}
                        step="0.01"
                        className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                        {...field}
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
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            // Same trap as the salary-type branches above.
                            if (
                              !checked &&
                              !Number.isFinite(
                                form.getValues("overtime_multiplier"),
                              )
                            ) {
                              form.setValue("overtime_multiplier", 1.5);
                              form.clearErrors("overtime_multiplier");
                            }
                          }}
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
                        <NumberInput
                          min={1}
                          max={10}
                          step="0.1"
                          className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                          {...field}
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
                      {/* A raise always starts tomorrow, so its start is shown,
                          not editable: a date typed here was silently ignored. */}
                      <Input
                        type="date"
                        {...field}
                        {...(replaceExisting
                          ? { value: tomorrow(timeZone), disabled: true }
                          : {})}
                        className="dark:border-darkBorder dark:bg-darkPrimaryBg"
                      />
                    </FormControl>
                    {replaceExisting ? (
                      <FormDescription>
                        The new profile starts tomorrow; the current one ends
                        today.
                      </FormDescription>
                    ) : null}
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

            {replaceBlockedBy ? (
              <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                {replaceBlockedBy}
              </p>
            ) : mode === "edit" && profile ? (
              <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={replaceExisting}
                    onChange={(event) => {
                      setReplaceExisting(event.target.checked);
                      // A raise leaves this profile's start as it is. Drop an
                      // edit to it, so an emptied box can't fail validation
                      // behind the disabled field with no way to fix it.
                      if (event.target.checked) {
                        form.setValue(
                          "effective_from",
                          toDateInputValue(profile.effective_from) ?? today(timeZone),
                        );
                        form.clearErrors("effective_from");
                      }
                    }}
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
