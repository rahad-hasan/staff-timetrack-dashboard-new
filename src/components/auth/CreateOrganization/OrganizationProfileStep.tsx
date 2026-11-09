"use client";

import { Building2, Globe, MapPin } from "lucide-react";
import { Control } from "react-hook-form";
import Link from "next/link";

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
  suggestions: string[];
  onPickSuggestion: (name: string) => void;
  disabled?: boolean;
  email?: string;
}

const OrganizationProfileStep = ({
  control,
  suggestions,
  onPickSuggestion,
  disabled,
  email,
}: OrganizationProfileStepProps) => {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
              Organization name
            </FormLabel>
            <FormControl>
              <div className="relative flex items-center">
                <Building2 className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                <Input
                  autoFocus
                  placeholder="Northwind"
                  disabled={disabled}
                  className="pl-10 h-12.5 rounded-xl border-slate-200 bg-white dark:bg-zinc-800 dark:border-zinc-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                  {...field}
                />
              </div>
            </FormControl>
            <OrgNameSuggestions
              suggestions={suggestions}
              onPick={onPickSuggestion}
              disabled={disabled}
            />
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PhoneNumberField
          control={control}
          name="phone"
          label="Phone number"
          placeholder="07700 900123"
          required
          disabled={disabled}
          inputClassName="w-full h-12.5 rounded-xl"
        />

        <ComboboxField
          control={control}
          name="time_zone"
          label="Time zone"
          options={popularTimeZoneList}
          icon={Globe}
          placeholder="London"
          searchPlaceholder="Search time zone..."
          emptyMessage="No time zone found."
          required
          disabled={disabled}
          className=" h-12.5 rounded-xl"
        />
      </div>

      <FormField
        control={control}
        name="address"
        render={({ field }) => (
          <FormItem className="space-y-1.5">
            <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
              Address
            </FormLabel>
            <FormControl>
              <div className="relative flex items-center">
                <MapPin className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="e.g. London, United Kingdom"
                  disabled={disabled}
                  className="pl-10 h-12.5 rounded-xl border-slate-200 bg-white dark:bg-zinc-800 dark:border-zinc-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {email && (
        <div className=" text-xs text-slate-500 dark:text-slate-400">
          Signed up as <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span> &bull;{" "}
          <Link href="/auth/login" className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
            Not you?
          </Link>
        </div>
      )}
    </div>
  );
};

export default OrganizationProfileStep;