"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  TICKET_CATEGORY_VALUES,
  TICKET_STATUS_VALUES,
} from "@/types/support";

const ALL_VALUE = "__all__";

interface TicketFiltersProps {
  status?: string;
  category?: string;
  search: string;
  onSearchChange: (value: string) => void;
}

const TicketFilters = ({
  status,
  category,
  search,
  onSearchChange,
}: TicketFiltersProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = (key: string, value?: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === ALL_VALUE) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    const nextUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    router.push(nextUrl, { scroll: false });
  };

  const clearAll = () => {
    router.push(pathname, { scroll: false });
    onSearchChange("");
  };

  const hasFilters = Boolean(status || category || search);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subTextColor" />
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by title or ticket number"
          className="pl-9 dark:border-darkBorder dark:bg-darkPrimaryBg"
        />
      </div>

      <Select
        value={status ?? ALL_VALUE}
        onValueChange={(value) => setParam("status", value)}
      >
        <SelectTrigger className="w-full sm:w-[180px] dark:bg-darkPrimaryBg">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All statuses</SelectItem>
          {TICKET_STATUS_VALUES.map((value) => (
            <SelectItem key={value} value={value}>
              {STATUS_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={category ?? ALL_VALUE}
        onValueChange={(value) => setParam("category", value)}
      >
        <SelectTrigger className="w-full sm:w-[200px] dark:bg-darkPrimaryBg">
          <SelectValue placeholder="All categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_VALUE}>All categories</SelectItem>
          {TICKET_CATEGORY_VALUES.map((value) => (
            <SelectItem key={value} value={value}>
              {CATEGORY_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button
          type="button"
          variant="outline2"
          onClick={clearAll}
          className="shrink-0 dark:bg-darkPrimaryBg"
        >
          <X className="size-4" />
          Clear
        </Button>
      ) : null}
    </div>
  );
};

export default TicketFilters;
