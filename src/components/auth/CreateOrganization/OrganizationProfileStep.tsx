"use client";

import { Building2, Globe, MapPin, Phone } from "lucide-react";
import { Control } from "react-hook-form";

import ComboboxField from "@/components/Common/ComboboxField";
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

interface OrganizationProfileStepProps {
  control: Control<CreateOrganizationFormValues>;
  disabled?: boolean;
}

/**
 * Step 1 — the only fields `POST /company` accepts. Everything here is
 * required by the API, so the user cannot advance without it.
 */
const OrganizationProfileStep = ({
  control,
  disabled,
}: OrganizationProfileStepProps) => (
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
          <FormMessage />
        </FormItem>
      )}
    />

    <FormField
      control={control}
      name="phone"
      render={({ field }) => (
        <FormItem>
          <FormLabel required>Phone Number</FormLabel>
          <FormControl>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subTextColor dark:text-darkTextSecondary" />
              <Input
                type="tel"
                placeholder="e.g. +8801711223344"
                disabled={disabled}
                className="pl-9 dark:bg-darkPrimaryBg dark:border-darkBorder"
                {...field}
                onChange={(event) =>
                  // The API validates against libphonenumber, which needs the
                  // country code — keep "+" and digits, drop the rest.
                  field.onChange(event.target.value.replace(/[^\d+]/g, ""))
                }
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
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
                placeholder="e.g. Dhaka, Bangladesh"
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

export default OrganizationProfileStep;
