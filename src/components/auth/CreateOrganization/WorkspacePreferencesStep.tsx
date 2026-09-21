"use client";

import { Clock, Info, Wallet } from "lucide-react";
import { Control, useWatch } from "react-hook-form";

import ComboboxField from "@/components/Common/ComboboxField";
import NumberStepper from "@/components/Common/NumberStepper";
import SegmentedPills, {
  type SegmentedPillOption,
} from "@/components/Common/SegmentedPills";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { WEEK_START_DAYS } from "@/lib/organization";
import { weekendPreview } from "@/lib/payroll";
import { currencies } from "@/utils/CurrencyList";
import { CreateOrganizationFormValues } from "@/zod/schema";

/**
 * Full day names are what the API stores (`WeekDay`), but seven of them will
 * not fit across half a dialog — the pills show the three-letter form and hand
 * back the stored value untouched.
 */
const WEEK_START_PILLS = WEEK_START_DAYS.map((day) => ({
  value: day,
  label: day.slice(0, 3),
}));

/**
 * The schema accepts 0–7 because the Company record does; the design only
 * offers the three lengths a real work week uses. Typed as `number` rather
 * than a 1 | 2 | 3 literal union so a value from outside the row can still be
 * compared against it without a cast.
 */
const WEEKEND_LENGTH_PILLS: ReadonlyArray<SegmentedPillOption<number>> = [
  { value: 1, label: "1 Day" },
  { value: 2, label: "2 Days" },
  { value: 3, label: "3 Days" },
  { value: 4, label: "4 Days" },
  { value: 5, label: "5 Days" },
];

const cardClass =
  "rounded-xl border border-borderColor bg-bgPrimary p-4 dark:border-darkBorder dark:bg-darkPrimaryBg";

const subLabelClass = "text-xs text-subTextColor dark:text-darkTextSecondary";

/**
 * Each field is a full-height column with its control pushed to the bottom.
 *
 * Grid cells already stretch to the tallest sibling, but the CONTROLS inside
 * them were still landing at different heights: "Choose how long a session can
 * be idle before it's paused." wraps to two lines at half-width while
 * "Choose the currency used in payroll and invoices." fits on one, so the
 * stepper sat a line lower than the select beside it. `mt-auto` pins both to a
 * shared baseline no matter how many lines the description above them takes —
 * which also holds at every breakpoint, unlike reserving a fixed height.
 */
const fieldClass = "flex h-full flex-col gap-1.5";
const controlSlotClass = "mt-auto pt-2";

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
      <div className={cardClass}>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-0">
          <FormField
            control={control}
            name="week_start"
            render={({ field }) => (
              <FormItem className={`${fieldClass} lg:pr-10`}>
                <FormLabel required>Week Start Day</FormLabel>

                <p className={subLabelClass}>
                  Choose the first day of your work week
                </p>

                <div className={controlSlotClass}>
                  <FormControl>
                    <SegmentedPills
                      options={WEEK_START_PILLS}
                      value={field.value ?? null}
                      onChange={field.onChange}
                      ariaLabel="Week start day"
                      size="sm"
                      fill
                      disabled={disabled}
                    />
                  </FormControl>

                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="weekly_leave_count"
            render={({ field }) => {
              const selected = WEEKEND_LENGTH_PILLS.some(
                (option) => option.value === field.value,
              )
                ? field.value
                : null;

              return (
                <FormItem
                  className={`${fieldClass} lg:border-l lg:border-borderColor lg:pl-10 dark:lg:border-darkBorder`}
                >
                  <FormLabel required>Weekend Length</FormLabel>

                  <p className={subLabelClass}>
                    Select how many days are considered the weekend
                  </p>

                  <div className={controlSlotClass}>
                    <FormControl>
                      <SegmentedPills
                        options={WEEKEND_LENGTH_PILLS}
                        value={selected}
                        onChange={field.onChange}
                        ariaLabel="Weekend length"
                        outline={true}
                        size="sm"
                        disabled={disabled}
                        className="w-full"
                      />
                    </FormControl>

                    <FormMessage />
                  </div>
                </FormItem>
              );
            }}
          />
        </div>

        {/* Which days those two answers actually land on is the thing people
            get wrong — spell it out instead of making them derive it. */}
        <p className="mt-4 text-xs text-headingTextColor dark:text-darkTextPrimary">
          Weekends will be&nbsp;
          <span className="font-semibold text-primary">{weekendLabel}</span>
        </p>
      </div>

      <div className={cardClass}>
        {/* Removed items-center so the two full-height columns align properly via flex stretching */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField
            control={control}
            name="idle_minutes_limit"
            render={({ field }) => (
              <FormItem className={fieldClass}>
                <FormLabel required>Idle Minutes Limit</FormLabel>
                <p className={subLabelClass}>
                  Choose how long a session can be idle before it&apos;s paused.
                </p>
                <div className={controlSlotClass}>
                  <FormControl>
                    <NumberStepper
                      value={field.value}
                      onChange={field.onChange}
                      min={1}
                      max={60}
                      suffix="Minutes"
                      icon={Clock}
                      disabled={disabled}
                      ariaLabel="Idle minutes limit"
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="currency"
            render={() => (
              <FormItem className={fieldClass}>

                <div className={controlSlotClass}>
                  <FormControl>
                    <ComboboxField
                      control={control}
                      name="currency"
                      label="Currency"
                      description="Choose the currency used in payroll and invoices."
                      fillHeight
                      options={currencies}
                      icon={Wallet}
                      placeholder="Select currency"
                      searchPlaceholder="Search currency..."
                      emptyMessage="No currency found."
                      required
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-subTextColor dark:text-darkTextSecondary">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <span>
          None of this is permanent — every one of these stays editable in
          Settings once your workspace is live.
        </span>
      </div>
    </div>
  );
};

export default WorkspacePreferencesStep;