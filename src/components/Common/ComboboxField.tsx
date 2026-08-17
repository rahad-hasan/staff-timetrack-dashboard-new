"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, type LucideIcon } from "lucide-react";
import { Control, FieldPath, FieldValues } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxFieldProps<TValues extends FieldValues> {
  control: Control<TValues>;
  name: FieldPath<TValues>;
  label: string;
  options: readonly ComboboxOption[];
  icon?: LucideIcon;
  /** Trigger text while nothing is selected. */
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Searchable single-select bound to a react-hook-form field.
 *
 * Lists long enough to need a filter (time zones, currencies) belong in a
 * `Command` rather than a `Select`. Two details matter:
 *
 * - The popover is controlled and closes on select. The synthetic
 *   `Escape` keypress used for this elsewhere in the app bubbles, so inside a
 *   dialog it would dismiss the dialog along with the popover.
 * - A value missing from `options` still renders as itself rather than
 *   collapsing to the placeholder, so a stored-but-unlisted code stays visible.
 */
const ComboboxField = <TValues extends FieldValues>({
  control,
  name,
  label,
  options,
  icon: Icon,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyMessage = "No match found.",
  required = false,
  disabled,
}: ComboboxFieldProps<TValues>) => {
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selected = options.find((option) => option.value === field.value);

        return (
          <FormItem className="flex flex-col">
            <FormLabel required={required}>{label}</FormLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline2"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="flex justify-between font-normal dark:text-darkTextPrimary hover:dark:bg-darkPrimaryBg"
                  >
                    <span className="flex items-center gap-2 truncate">
                      {Icon && (
                        <Icon className="h-4 w-4 shrink-0 text-subTextColor dark:text-darkTextSecondary" />
                      )}
                      {selected?.label || field.value || placeholder}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0 dark:bg-darkSecondaryBg dark:border-darkBorder">
                <Command className="dark:bg-darkSecondaryBg">
                  <CommandInput placeholder={searchPlaceholder} />
                  <CommandList className="max-h-60 overflow-y-auto no-scrollbar scroll-smooth">
                    <CommandEmpty>{emptyMessage}</CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => (
                        <CommandItem
                          key={option.value}
                          value={option.label}
                          onSelect={() => {
                            field.onChange(option.value);
                            setOpen(false);
                          }}
                          className="cursor-pointer hover:dark:bg-darkPrimaryBg"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              option.value === field.value
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {option.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};

export default ComboboxField;
