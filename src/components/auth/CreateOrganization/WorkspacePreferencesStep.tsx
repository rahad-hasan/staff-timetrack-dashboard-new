"use client";

import { Clock, Info, Wallet } from "lucide-react";
import { Control, useWatch } from "react-hook-form";

import ComboboxField from "@/components/Common/ComboboxField";
import NumberInput from "@/components/Common/NumberInput";
import {
  FormControl,
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
import {
  WEEK_START_DAYS,
  WEEKEND_LENGTH_OPTIONS,
} from "@/lib/organization";
import { weekendPreview } from "@/lib/payroll";
import { currencies } from "@/utils/CurrencyList";
import { CreateOrganizationFormValues } from "@/zod/schema";

interface WorkspacePreferencesStepProps {
  control: Control<CreateOrganizationFormValues>;
  disabled?: boolean;
}

/**
 * Step 2 — everything `POST /company` ignores. These are written by a
 * follow-up `PATCH /company/:id` once the company exists, and together they
 * drive tracking, payroll workday counting and invoice amounts.
 */
const WorkspacePreferencesStep = ({
  control,
  disabled,
}: WorkspacePreferencesStepProps) => {
  const weekStart = useWatch({ control, name: "week_start" });
  const weeklyLeaveCount = useWatch({ control, name: "weekly_leave_count" });

  const weekendLabel = weekendPreview(
    weekStart || "Monday",
    Number.isFinite(weeklyLeaveCount) ? weeklyLeaveCount : 2,
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="week_start"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Week Start Day</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger className="w-full dark:bg-darkPrimaryBg dark:border-darkBorder">
                    <SelectValue placeholder="Select start day" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="dark:border-darkBorder">
                  {WEEK_START_DAYS.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="weekly_leave_count"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Weekend Length</FormLabel>
              <Select
                value={String(field.value ?? "")}
                onValueChange={(value) => field.onChange(Number(value))}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger className="w-full dark:bg-darkPrimaryBg dark:border-darkBorder">
                    <SelectValue placeholder="Select weekend length" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="dark:border-darkBorder">
                  {WEEKEND_LENGTH_OPTIONS.map((count) => (
                    <SelectItem key={count} value={String(count)}>
                      {count} day{count === 1 ? "" : "s"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="idle_minutes_limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel required>Idle Minutes Limit</FormLabel>
              <FormControl>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subTextColor dark:text-darkTextSecondary" />
                  <NumberInput
                    inputMode="numeric"
                    min={1}
                    max={60}
                    className="pl-9 pr-16 dark:bg-darkPrimaryBg dark:border-darkBorder"
                    {...field}
                    disabled={disabled}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-subTextColor dark:text-darkTextSecondary">
                    minutes
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <ComboboxField
          control={control}
          name="currency"
          label="Currency"
          options={currencies}
          icon={Wallet}
          placeholder="Select currency"
          searchPlaceholder="Search currency..."
          emptyMessage="No currency found."
          required
          disabled={disabled}
        />
      </div>

      <div className="rounded-lg border border-dashed border-borderColor bg-bgSecondary/60 px-3 py-2.5 text-xs text-headingTextColor dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary">
        Weekends will be&nbsp;
        <span className="font-semibold text-primary">{weekendLabel}</span>
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-borderColor bg-bgSecondary/60 px-3 py-2.5 text-xs text-subTextColor dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextSecondary">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          Weekends drive payroll workday counting, the idle limit tells the
          desktop tracker when to pause a session, and the currency is what
          payroll and invoices are denominated in. All of it stays editable in
          Settings.
        </span>
      </div>
    </div>
  );
};

export default WorkspacePreferencesStep;
