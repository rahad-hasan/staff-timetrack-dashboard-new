"use client";

import { Building2, Globe, MapPin } from "lucide-react";
import { Control } from "react-hook-form";

import ComboboxField from "@/components/Common/ComboboxField";
import PhoneNumberField from "@/components/Common/PhoneNumberField";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { popularTimeZoneList } from "@/utils/TimeZoneList";
import { CreateOrganizationFormValues } from "@/zod/schema";
import OrgNameSuggestions from "./OrgNameSuggestions";

interface OrganizationProfileStepProps {
  control: Control<CreateOrganizationFormValues>;
  /**
   * Built once by the form hook, because its first entry is also the field's
   * default value — recomputing them here would let the two drift apart.
   */
  suggestions: string[];
  /** Writes the picked suggestion through the form, validation included. */
  onPickSuggestion: (name: string) => void;
  disabled?: boolean;
}

/**
 * Step 1 — the only fields `POST /company` accepts. Everything here is
 * required by the API, so the user cannot advance without it.
 */
const OrganizationProfileStep = ({
  control,
  suggestions,
  onPickSuggestion,
  disabled,
}: OrganizationProfileStepProps) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel required>Organization Name</FormLabel>
            <FormControl>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subTextColor dark:text-darkTextSecondary" />
                <Input
                  autoFocus
                  placeholder="e.g. Galaxy Space"
                  disabled={disabled}
                  className="pl-9 dark:bg-darkPrimaryBg dark:border-darkBorder"
                  {...field}
                />
              </div>
            </FormControl>
            {/* Under the input and above the message: a picked chip always
                validates, so the two can never be on screen together. */}
            <OrgNameSuggestions
              suggestions={suggestions}
              onPick={onPickSuggestion}
              disabled={disabled}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <PhoneNumberField
        control={control}
        name="phone"
        label="Phone Number"
        placeholder="Enter Phone Number"
        required
        disabled={disabled}
      />

      <ComboboxField
        control={control}
        name="time_zone"
        label="Time Zone"
        options={popularTimeZoneList}
        icon={Globe}
        placeholder="Select time zone"
        searchPlaceholder="Search time zone..."
        emptyMessage="No time zone found."
        required
        disabled={disabled}
      />

      <FormField
        control={control}
        name="address"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel required>Address</FormLabel>
            <FormControl>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subTextColor dark:text-darkTextSecondary" />
                <Input
                  placeholder="Enter address here"
                  disabled={disabled}
                  className="pl-9 dark:bg-darkPrimaryBg dark:border-darkBorder"
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default OrganizationProfileStep;
