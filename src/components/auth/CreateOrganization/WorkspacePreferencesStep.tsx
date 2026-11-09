"use client";

import { Info, Wallet } from "lucide-react";
import { Control, useWatch } from "react-hook-form";

import ComboboxField from "@/components/Common/ComboboxField";
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
import { Slider } from "@/components/ui/slider";
import { WEEK_START_DAYS } from "@/lib/organization";
import { currencies } from "@/utils/CurrencyList";
import { CreateOrganizationFormValues } from "@/zod/schema";

const WEEK_START_PILLS = WEEK_START_DAYS.map((day) => ({
  value: day,
  label: day.slice(0, 3),
}));

const WEEKEND_LENGTH_PILLS: ReadonlyArray<SegmentedPillOption<number>> = [
  { value: 1, label: "1 day" },
  { value: 2, label: "2 days" },
  { value: 3, label: "3 days" },
  { value: 4, label: "4 days" },
  { value: 5, label: "5 days" },
];

interface WorkspacePreferencesStepProps {
  control: Control<CreateOrganizationFormValues>;
  disabled?: boolean;
}

const WorkspacePreferencesStep = ({
  control,
  disabled,
}: WorkspacePreferencesStepProps) => {
  const idleMinutes = useWatch({ control, name: "idle_minutes_limit" }) ?? 10;

  return (
    <div className="space-y-6">
      {/* Week Start Day */}
      <FormField
        control={control}
        name="week_start"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel className="font-semibold text-slate-800 dark:text-slate-200">
              Week start day
            </FormLabel>
            <FormControl>
              <SegmentedPills
                options={WEEK_START_PILLS}
                value={field.value ?? null}
                onChange={field.onChange}
                ariaLabel="Week start day"
                outline={true}
                size="sm"
                fill
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Weekend Length */}
      <FormField
        control={control}
        name="weekly_leave_count"
        render={({ field }) => {
          const selected = WEEKEND_LENGTH_PILLS.some(
            (option) => option.value === field.value
          )
            ? field.value
            : null;

          return (
            <FormItem className="space-y-2">
              <FormLabel className="font-semibold text-slate-800 dark:text-slate-200">
                Weekend length
              </FormLabel>
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
            </FormItem>
          );
        }}
      />

      {/* Idle Minutes Limit - Range Slider matching Figma screenshot */}
      <FormField
        control={control}
        name="idle_minutes_limit"
        render={({ field }) => (
          <FormItem className="">
            <div className="flex items-center justify-between">
              <FormLabel className="font-semibold text-slate-800 dark:text-slate-200">
                Idle minutes limit
              </FormLabel>
              <span className="text-sm font-bold text-[#0160F1] dark:text-blue-400">
                {idleMinutes} min
              </span>
            </div>

            <FormControl>
              <div className=" pb-1">
                <Slider
                  min={1}
                  max={60}
                  step={1}
                  disabled={disabled}
                  value={[field.value ?? 10]}
                  onValueChange={(vals) => field.onChange(vals[0])}
                  className="cursor-pointer"
                />
              </div>
            </FormControl>

            <div className="flex items-center justify-between text-xs text-slate-800 dark:text-slate-500 pt-0.5">
              <span>1 min</span>
              <span>Pauses tracking after {idleMinutes} min of no input</span>
              <span>60 min</span>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Currency Selection */}
      <FormField
        control={control}
        name="currency"
        render={() => (
          <FormItem className="space-y-2">
            <FormControl>
              <ComboboxField
                control={control}
                name="currency"
                label="Currency"
                options={currencies}
                icon={Wallet}
                placeholder="GBP — British Pound"
                searchPlaceholder="Search currency..."
                emptyMessage="No currency found."
                required
                disabled={disabled}
                className="h-12.5 rounded-xl"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Footer Info Callout */}
      <div className="flex items-center gap-2 -mt-1.5 text-xs text-slate-700 dark:text-slate-400">
        <Info className="size-3.5 shrink-0 text-slate-400" />
        <span>
          Nothing here is permanent — change it any time in Settings.
        </span>
      </div>
    </div>
  );
};

export default WorkspacePreferencesStep;