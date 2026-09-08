// "use client";

// import { Clock, Info, Wallet } from "lucide-react";
// import { Control, useWatch } from "react-hook-form";

// import ComboboxField from "@/components/Common/ComboboxField";
// import NumberInput from "@/components/Common/NumberInput";
// import {
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   WEEK_START_DAYS,
//   WEEKEND_LENGTH_OPTIONS,
// } from "@/lib/organization";
// import { weekendPreview } from "@/lib/payroll";
// import { currencies } from "@/utils/CurrencyList";
// import { CreateOrganizationFormValues } from "@/zod/schema";

// interface WorkspacePreferencesStepProps {
//   control: Control<CreateOrganizationFormValues>;
//   disabled?: boolean;
// }

// /**
//  * Step 2 — everything `POST /company` ignores. These are written by a
//  * follow-up `PATCH /company/:id` once the company exists, and together they
//  * drive tracking, payroll workday counting and invoice amounts.
//  */
// const WorkspacePreferencesStep = ({
//   control,
//   disabled,
// }: WorkspacePreferencesStepProps) => {
//   const weekStart = useWatch({ control, name: "week_start" });
//   const weeklyLeaveCount = useWatch({ control, name: "weekly_leave_count" });

//   const weekendLabel = weekendPreview(
//     weekStart || "Monday",
//     Number.isFinite(weeklyLeaveCount) ? weeklyLeaveCount : 2,
//   );

//   return (
//     <div className="space-y-4">
//       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
//         <FormField
//           control={control}
//           name="week_start"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel required>Week Start Day</FormLabel>
//               <Select
//                 value={field.value}
//                 onValueChange={field.onChange}
//                 disabled={disabled}
//               >
//                 <FormControl>
//                   <SelectTrigger className="w-full dark:bg-darkPrimaryBg dark:border-darkBorder">
//                     <SelectValue placeholder="Select start day" />
//                   </SelectTrigger>
//                 </FormControl>
//                 <SelectContent className="dark:border-darkBorder">
//                   {WEEK_START_DAYS.map((day) => (
//                     <SelectItem key={day} value={day}>
//                       {day}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         <FormField
//           control={control}
//           name="weekly_leave_count"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel required>Weekend Length</FormLabel>
//               <Select
//                 value={String(field.value ?? "")}
//                 onValueChange={(value) => field.onChange(Number(value))}
//                 disabled={disabled}
//               >
//                 <FormControl>
//                   <SelectTrigger className="w-full dark:bg-darkPrimaryBg dark:border-darkBorder">
//                     <SelectValue placeholder="Select weekend length" />
//                   </SelectTrigger>
//                 </FormControl>
//                 <SelectContent className="dark:border-darkBorder">
//                   {WEEKEND_LENGTH_OPTIONS.map((count) => (
//                     <SelectItem key={count} value={String(count)}>
//                       {count} day{count === 1 ? "" : "s"}
//                     </SelectItem>
//                   ))}
//                 </SelectContent>
//               </Select>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         <FormField
//           control={control}
//           name="idle_minutes_limit"
//           render={({ field }) => (
//             <FormItem>
//               <FormLabel required>Idle Minutes Limit</FormLabel>
//               <FormControl>
//                 <div className="relative">
//                   <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subTextColor dark:text-darkTextSecondary" />
//                   <NumberInput
//                     inputMode="numeric"
//                     min={1}
//                     max={60}
//                     className="pl-9 pr-16 dark:bg-darkPrimaryBg dark:border-darkBorder"
//                     {...field}
//                     disabled={disabled}
//                   />
//                   <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-subTextColor dark:text-darkTextSecondary">
//                     minutes
//                   </span>
//                 </div>
//               </FormControl>
//               <FormMessage />
//             </FormItem>
//           )}
//         />

//         <ComboboxField
//           control={control}
//           name="currency"
//           label="Currency"
//           options={currencies}
//           icon={Wallet}
//           placeholder="Select currency"
//           searchPlaceholder="Search currency..."
//           emptyMessage="No currency found."
//           required
//           disabled={disabled}
//         />
//       </div>

//       <div className="rounded-lg border border-dashed border-borderColor bg-bgSecondary/60 px-3 py-2.5 text-xs text-headingTextColor dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary">
//         Weekends will be&nbsp;
//         <span className="font-semibold text-primary">{weekendLabel}</span>
//       </div>

//       <div className="flex items-start gap-2 rounded-lg border border-borderColor bg-bgSecondary/60 px-3 py-2.5 text-xs text-subTextColor dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextSecondary">
//         <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
//         <span>
//           Weekends drive payroll workday counting, the idle limit tells the
//           desktop tracker when to pause a session, and the currency is what
//           payroll and invoices are denominated in. All of it stays editable in
//           Settings.
//         </span>
//       </div>
//     </div>
//   );
// };

// export default WorkspacePreferencesStep;

"use client";

import { Clock, Wallet, Check } from "lucide-react";
import { Control, useWatch } from "react-hook-form";

import ComboboxField from "@/components/Common/ComboboxField";
import NumberInput from "@/components/Common/NumberInput";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";

import { WEEK_START_DAYS, WEEKEND_LENGTH_OPTIONS } from "@/lib/organization";

import { currencies } from "@/utils/CurrencyList";
import { CreateOrganizationFormValues } from "@/zod/schema";

interface WorkspacePreferencesStepProps {
  control: Control<CreateOrganizationFormValues>;
  disabled?: boolean;
}

const WorkspacePreferencesStep = ({
  control,
  disabled,
}: WorkspacePreferencesStepProps) => {
  const weekStart = useWatch({
    control,
    name: "week_start",
  });

  const weeklyLeaveCount = useWatch({
    control,
    name: "weekly_leave_count",
  });

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-borderColor bg-white px-4 sm:px-7 py-4 sm:py-7 dark:border-darkBorder dark:bg-darkPrimaryBg">
        <div className="grid grid-cols-1 gap-4 lg:gap-0 lg:grid-cols-[1.25fr_1fr]">
          <FormField
            control={control}
            name="week_start"
            render={({ field }) => (
              <FormItem>
                <div className="mb-1.5">
                  <FormLabel
                    required
                    className="text-[22px] font-semibold text-headingTextColor dark:text-darkTextPrimary"
                  >
                    Week Start Day
                  </FormLabel>

                  <p className="mt-1 mb-1 text-base text-subTextColor dark:text-darkTextSecondary">
                    Choose the first day of your work week
                  </p>
                </div>

                <FormControl>
                  <div className="flex flex-wrap gap-2">
                    {WEEK_START_DAYS.map((day) => {
                      const isSelected = field.value === day;
                      const shortDay = day.slice(0, 3);

                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={disabled}
                          onClick={() => field.onChange(day)}
                          className={`
                              flex h-[31px] min-w-[52px] items-center justify-center
                              gap-1.5 rounded-md border px-4 text-sm font-medium
                              transition-all
                              ${
                                isSelected
                                  ? "border-primary bg-primary text-white"
                                  : "border-borderColor bg-white text-headingTextColor hover:border-primary hover:text-primary dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                              }
                              ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                            `}
                        >
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 rounded-full bg-white p-0.5 text-primary" />
                          )}

                          {shortDay}
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          {/* Vertical divider */}
          <div className="relative lg:border-l lg:border-borderColor lg:pl-6 dark:lg:border-darkBorder">
            <FormField
              control={control}
              name="weekly_leave_count"
              render={({ field }) => (
                <FormItem>
                  <div className="mb-1.5">
                    <FormLabel
                      required
                      className="text-[22px] font-semibold text-headingTextColor dark:text-darkTextPrimary"
                    >
                      Weekend Length
                    </FormLabel>

                    <p className="mt-1 mb-1 text-base text-subTextColor dark:text-darkTextSecondary">
                      Select how many days are considered the weekend
                    </p>
                  </div>

                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {WEEKEND_LENGTH_OPTIONS.map((count) => {
                        const isSelected =
                          Number(field.value) === Number(count);

                        return (
                          <button
                            key={count}
                            type="button"
                            disabled={disabled}
                            onClick={() => field.onChange(Number(count))}
                            className={`
                              flex h-[31px] items-center justify-center
                              gap-1.5 rounded-md border px-3.5 text-sm font-medium
                              transition-all
                              ${
                                isSelected
                                  ? "border-primary bg-primary/5 text-primary dark:bg-darkPrimaryBg"
                                  : "border-borderColor bg-white text-headingTextColor hover:border-primary hover:text-primary dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                              }
                              ${
                                disabled
                                  ? "cursor-not-allowed opacity-50"
                                  : "cursor-pointer"
                              }
                            `}
                          >
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 bg-primary text-white rounded-full p-0.5" />
                            )}

                            <p className="mt-0.5">
                              {count} Day{count === 1 ? "" : "s"}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>

      {/* =========================
          BOTTOM SECTION
      ========================== */}
      <div className="rounded-2xl border border-borderColor bg-white px-4 sm:px-7 py-4 sm:py-7 dark:border-darkBorder dark:bg-darkPrimaryBg">
        <div className="grid grid-cols-1 gap-4 lg:gap-8 lg:grid-cols-[1.1fr_1fr]">
          {/* Idle Minutes */}
          <FormField
            control={control}
            name="idle_minutes_limit"
            render={({ field }) => (
              <FormItem>
                <div className="mb-1.5">
                  <FormLabel
                    required
                    className="text-[22px] font-semibold text-headingTextColor dark:text-darkTextPrimary"
                  >
                    Idle Minutes Limit
                  </FormLabel>

                  <p className="mt-1 text-base text-subTextColor dark:text-darkTextSecondary">
                    Choose how long a session can be idle before it’s paused.
                  </p>
                </div>

                <FormControl>
                  <div className="relative px-2 flex h-[48px] items-center justify-between rounded-lg border border-borderColor bg-white dark:border-darkBorder dark:bg-darkPrimaryBg">
                    <div className=" flex items-center gap-2.5 sm:gap-5">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          const currentValue = Number(field.value) || 1;
                          field.onChange(Math.max(1, currentValue - 1));
                        }}
                        className=" flex h-[36px] w-[40px] items-center justify-center rounded-md border border-borderColor text-xl text-headingTextColor transition hover:border-primary hover:text-primary dark:border-darkBorder dark:text-darkTextPrimary"
                      >
                        −
                      </button>
                      {/* Value */}
                      <div className="flex flex-1 items-center justify-center gap-3">
                        <Clock className="h-5 w-5 text-headingTextColor dark:text-darkTextPrimary" />

                        <NumberInput
                          inputMode="numeric"
                          min={1}
                          max={60}
                          {...field}
                          disabled={disabled}
                          className="h-auto mt-0.5 w-8 sm:w-16 border-0 bg-transparent p-0 text-base font-medium shadow-none focus-visible:ring-0 dark:bg-transparent"
                        />
                      </div>
                    </div>

                    {/* Minutes */}
                    <div className=" flex items-center sm:gap-2">
                      <span className="mr-2 sm:mr-5 text-base text-subTextColor dark:text-darkTextSecondary">
                        Minutes
                      </span>

                      {/* Plus */}
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          const currentValue = Number(field.value) || 1;
                          field.onChange(Math.min(60, currentValue + 1));
                        }}
                        className="flex h-[36px] w-[40px] items-center justify-center rounded-md border border-borderColor text-xl text-headingTextColor transition hover:border-primary hover:text-primary dark:border-darkBorder dark:text-darkTextPrimary"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          {/* Currency */}
          <div className="relative lg:border-l lg:border-borderColor lg:pl-6 dark:lg:border-darkBorder">
            <div className="mb-1.5">
              <FormLabel
                required
                className="text-[22px] font-semibold text-headingTextColor dark:text-darkTextPrimary"
              >
                Currency
              </FormLabel>

              <p className="mt-1 text-base text-subTextColor dark:text-darkTextSecondary">
                Choose the currency used in payroll and invoices.
              </p>
            </div>
            <ComboboxField
              control={control}
              name="currency"
              options={currencies}
              icon={Wallet}
              placeholder="Select currency"
              searchPlaceholder="Search currency..."
              emptyMessage="No currency found."
              required={false}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspacePreferencesStep;
