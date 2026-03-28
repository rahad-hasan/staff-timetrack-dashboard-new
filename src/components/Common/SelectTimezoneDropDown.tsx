"use client";

import React, { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import DownArrow from "@/components/Icons/DownArrow";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";

type TimezoneOption = {
  value: string;
  label: string;
};

interface SelectTimezoneDropDownProps {
  timezones: { data: TimezoneOption[]; defaultValue: string };
}

const SelectTimezoneDropDown = ({ timezones }: SelectTimezoneDropDownProps) => {
  const loader = useTopLoader();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedTimezone =
    searchParams.get("timezone") ?? timezones.defaultValue;
  const [open, setOpen] = useState(false);

  const selectTimezone = useMemo(
    () =>
      timezones.data.find((p: TimezoneOption) => p.value === selectedTimezone),
    [timezones, selectedTimezone],
  );

  const handleSelect = (timezone: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (timezone === selectedTimezone) {
      params.delete("timezone");
    } else {
      params.set("timezone", timezone);
    }
    loader.start();
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline2"
          role="combobox"
          aria-expanded={open}
          className=" 2xl:w-[90px] h-10 bg-[#f6f7f9] flex justify-between items-center gap-2 dark:border-darkBorder dark:text-darkTextPrimary dark:bg-darkPrimaryBg hover:dark:bg-darkPrimaryBg"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="truncate max-w-[150px]">
              {selectTimezone ? selectTimezone.label.split(" ")[0] : "GMT"}
            </span>
          </div>
          <DownArrow size={16} />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="sm:w-[150px] p-0 dark:bg-darkSecondaryBg dark:border-darkBorder">
        <Command className="dark:bg-darkSecondaryBg">
          <CommandList>
            <CommandGroup>
              {timezones.data.map((project: TimezoneOption) => (
                <CommandItem
                  key={project.value}
                  value={project.label}
                  onSelect={() => handleSelect(project.value)}
                  className="cursor-pointer hover:dark:bg-darkPrimaryBg"
                >
                  <span className="truncate">{project.label}</span>

                  <Check
                    className={cn(
                      "ml-auto h-4 w-4 shrink-0",
                      selectedTimezone === project.value
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default React.memo(SelectTimezoneDropDown);
