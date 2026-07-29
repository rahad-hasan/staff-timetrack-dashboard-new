"use client";

import { ChangeEvent, memo, useEffect, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type {
  ISuspensionReasonOption,
  TSeverity,
  TSuspensionStatusFilter,
} from "@/types/trackingSuspension";
import { reasonLabel } from "./ReasonChip";

interface Props {
  search: string;
  reason: string;
  severity: TSeverity | "all";
  status: TSuspensionStatusFilter | "all";
  sort: string;
  order: "asc" | "desc";
  reasons: ISuspensionReasonOption[];
  showEventFilters?: boolean;
  onChange: (next: {
    search?: string;
    reason?: string;
    severity?: TSeverity | "all";
    status?: TSuspensionStatusFilter | "all";
    sort?: string;
    order?: "asc" | "desc";
  }) => void;
  onReset: () => void;
}

const SORT_SUMMARY: Array<{ value: string; label: string }> = [
  { value: "last_suspended_at|desc", label: "Most recent" },
  { value: "event_count|desc", label: "Most events" },
  { value: "total_duration_sec|desc", label: "Longest paused" },
  { value: "name|asc", label: "Name A → Z" },
];

function SuspensionsFiltersImpl({
  search,
  reason,
  severity,
  status,
  sort,
  order,
  reasons,
  showEventFilters,
  onChange,
  onReset,
}: Props) {
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 300);

  useEffect(() => {
    if (debouncedSearch !== search) {
      onChange({ search: debouncedSearch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="relative h-10 w-full sm:w-[280px]">
        <Search
          aria-hidden
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-darkTextSecondary"
          size={18}
        />
        <Input
          type="text"
          placeholder="Search name or email"
          value={searchInput}
          maxLength={120}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setSearchInput(e.target.value)
          }
          aria-label="Search by name or email"
          className="h-10 pl-9 dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Select
          value={reason || "all"}
          onValueChange={(v) => onChange({ reason: v === "all" ? "" : v })}
        >
          <SelectTrigger
            className={cn(
              "h-10 min-w-[180px] border-borderColor bg-bgPrimary text-headingTextColor",
              "dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary",
            )}
            aria-label="Filter by reason"
          >
            <SelectValue placeholder="All reasons" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reasons</SelectItem>
            {reasons.map((r) => (
              <SelectItem key={r.reason} value={r.reason}>
                {reasonLabel(r.reason)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showEventFilters && (
          <>
            <Select
              value={severity}
              onValueChange={(v) =>
                onChange({ severity: v as TSeverity | "all" })
              }
            >
              <SelectTrigger
                className="h-10 min-w-[150px] border-borderColor bg-bgPrimary text-headingTextColor dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                aria-label="Filter by severity"
              >
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(v) =>
                onChange({ status: v as TSuspensionStatusFilter | "all" })
              }
            >
              <SelectTrigger
                className="h-10 min-w-[150px] border-borderColor bg-bgPrimary text-headingTextColor dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                aria-label="Filter by status"
              >
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}

        {!showEventFilters && (
          <Select
            value={`${sort}|${order}`}
            onValueChange={(v) => {
              const [s, o] = v.split("|");
              onChange({ sort: s, order: o as "asc" | "desc" });
            }}
          >
            <SelectTrigger
              className="h-10 min-w-[170px] border-borderColor bg-bgPrimary text-headingTextColor dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
              aria-label="Sort"
            >
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_SUMMARY.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          type="button"
          variant="outline2"
          size="default"
          onClick={onReset}
          aria-label="Reset filters"
        >
          <RotateCcw className="size-4" />
          Reset
        </Button>
      </div>
    </div>
  );
}

export const SuspensionsFilters = memo(SuspensionsFiltersImpl);
