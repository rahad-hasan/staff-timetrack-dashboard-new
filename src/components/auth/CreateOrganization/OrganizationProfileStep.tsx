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
  <div className=" space-y-4">
    <FormField
      control={control}
      name="name"
      render={({ field }) => (
        <FormItem className="sm:col-span-2 pb-2">
          <FormLabel required>Organization Name</FormLabel>
          <FormControl>
            <div className="relative flex items-center">
              <Building2 className="pointer-events-none absolute left-3 h-6 w-6 text-primary bg-[#edf4fe] p-1 rounded-md" />
              <Input
                autoFocus
                placeholder="Enter Your Organization Name"
                disabled={disabled}
                className="pl-11 dark:bg-darkPrimaryBg border-[#DFE1E8EE] dark:border-[#DFE1E8EE] focus-visible:border-primary focus-visible:ring-primary/10"
                {...field}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    {/* <p className=" text-subTextColor">Need inspiration? Try one of these</p> */}
    <div className="w-full space-y-4 md:grid md:grid-cols-[3fr_2fr] md:items-start md:gap-4 md:space-y-0">
      <PhoneNumberField
        control={control}
        name="phone"
        label="Phone Number"
        placeholder="Enter Phone Number"
        required
        disabled={disabled}
        inputClassName="w-full border-[#DFE1E8EE] dark:border-[#DFE1E8EE] focus-visible:border-primary focus-visible:ring-primary/10"
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
    </div>

    <FormField
      control={control}
      name="address"
      render={({ field }) => (
        <FormItem className="sm:col-span-2 pt-2">
          <FormLabel required>Address</FormLabel>
          <FormControl>
            <div className="relative flex items-center">
              <MapPin className="pointer-events-none absolute left-3 h-6 w-6 text-primary bg-[#edf4fe] p-1 rounded-md" />
              <Input
                placeholder="e.g. London, United Kingdom"
                disabled={disabled}
                className="pl-11 dark:bg-darkPrimaryBg  border-[#DFE1E8EE] dark:border-[#DFE1E8EE] focus-visible:border-primary focus-visible:ring-primary/10"
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
