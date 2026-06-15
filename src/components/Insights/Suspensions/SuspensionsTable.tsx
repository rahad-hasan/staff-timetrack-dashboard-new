"use client";

import Image from "next/image";
import { memo, useCallback } from "react";
import { ArrowUpDown, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import EmptyTableRow from "@/components/Common/EmptyTableRow";
import type { ISuspensionSummaryRow } from "@/types/trackingSuspension";
import { ReasonChip } from "./ReasonChip";

interface SortHeaderProps {
  label: string;
  field: string;
  activeSort: string;
  activeOrder: "asc" | "desc";
  onSort: (field: string) => void;
  className?: string;
}

const SortHeader = memo(function SortHeader({
  label,
  field,
  activeSort,
  onSort,
  className,
}: SortHeaderProps) {
  const isActive = activeSort === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        "inline-flex items-center gap-1 text-left font-normal text-headingTextColor dark:text-darkTextPrimary",
        className,
      )}
      aria-label={`Sort by ${label}`}
    >
      {label}
      <ArrowUpDown
        className={cn(
          "ml-0.5 size-3.5 transition-opacity",
          isActive ? "opacity-100 text-primary" : "opacity-40",
        )}
      />
    </button>
  );
});

interface RowProps {
  row: ISuspensionSummaryRow;
  onView: (userId: number) => void;
  isSelected: boolean;
}

const SummaryRow = memo(
  function SummaryRowImpl({ row, onView, isSelected }: RowProps) {
    const handleView = useCallback(() => onView(row.user.id), [onView, row.user.id]);
    return (
      <TableRow
        className={cn(
          isSelected && "bg-primary/5 dark:bg-primary/10",
          "hover:bg-bgSecondary/60 dark:hover:bg-darkSecondaryBg/60",
        )}
      >
        <TableCell>
          <div className="flex items-center gap-3 min-w-[220px]">
            <div className="relative size-9 overflow-hidden rounded-full border border-borderColor bg-bgSecondary dark:border-darkBorder dark:bg-darkSecondaryBg">
              {row.user.image ? (
                <Image
                  src={row.user.image}
                  alt={`${row.user.name} avatar`}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold uppercase text-subTextColor dark:text-darkTextSecondary">
                  {row.user.name?.[0] ?? "?"}
                </span>
              )}
            </div>
            <div className="leading-tight">
              <div className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                {row.user.name}
              </div>
              <div className="text-xs text-subTextColor dark:text-darkTextSecondary">
                {row.user.email}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-center font-semibold">{row.event_count}</TableCell>
        <TableCell className="text-center">
          {row.ongoing_count > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-300">
              <span className="relative inline-flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-red-500" />
              </span>
              {row.ongoing_count}
            </span>
          ) : (
            <span className="text-subTextColor dark:text-darkTextSecondary">0</span>
          )}
        </TableCell>
        <TableCell className="text-center">
          {row.high_severity_count > 0 ? (
            <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-xs font-semibold text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
              {row.high_severity_count}
            </span>
          ) : (
            <span className="text-subTextColor dark:text-darkTextSecondary">0</span>
          )}
        </TableCell>
        <TableCell className="tabular-nums">{row.total_duration}</TableCell>
        <TableCell>
          <span className="text-sm text-subTextColor dark:text-darkTextSecondary">
            {row.last_event_at_format ?? "—"}
          </span>
        </TableCell>
        <TableCell>
          <ReasonChip code={row.top_reason} />
        </TableCell>
        <TableCell className="text-right">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleView}
            aria-label={`View suspension events for ${row.user.name}`}
            aria-haspopup="dialog"
            aria-expanded={isSelected}
            data-user-view-id={row.user.id}
          >
            View
            <ChevronRight className="size-3.5" />
          </Button>
        </TableCell>
      </TableRow>
    );
  },
  (prev, next) =>
    prev.row.user.id === next.row.user.id &&
    prev.row.event_count === next.row.event_count &&
    prev.row.ongoing_count === next.row.ongoing_count &&
    prev.row.high_severity_count === next.row.high_severity_count &&
    prev.row.total_duration === next.row.total_duration &&
    prev.row.last_event_at === next.row.last_event_at &&
    prev.row.top_reason === next.row.top_reason &&
    prev.isSelected === next.isSelected &&
    prev.onView === next.onView,
);

interface Props {
  rows: ISuspensionSummaryRow[];
  loading: boolean;
  sort: string;
  order: "asc" | "desc";
  onSort: (field: string) => void;
  onView: (userId: number) => void;
  selectedUserId: number | null;
}

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <TableRow>
      {Array.from({ length: cols }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 w-full max-w-[120px] animate-pulse rounded bg-bgSecondary dark:bg-darkSecondaryBg" />
        </TableCell>
      ))}
    </TableRow>
  );
}

const COLUMNS = [
  { key: "name", label: "Employee", sortable: true },
  { key: "event_count", label: "Events", sortable: true, align: "center" as const },
  { key: "ongoing", label: "Ongoing", sortable: false, align: "center" as const },
  { key: "high", label: "High sev", sortable: false, align: "center" as const },
  { key: "total_duration_sec", label: "Total duration", sortable: true },
  { key: "last_suspended_at", label: "Last activity", sortable: true },
  { key: "top_reason", label: "Top reason", sortable: false },
  { key: "view", label: "", sortable: false, align: "right" as const },
];

function SuspensionsTableImpl({
  rows,
  loading,
  sort,
  order,
  onSort,
  onView,
  selectedUserId,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-[12px] border border-borderColor bg-bgPrimary pb-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
      <Table>
        <TableHeader>
          <TableRow>
            {COLUMNS.map((c) => {
              const isActive = c.sortable && sort === c.key;
              const ariaSort = c.sortable
                ? isActive
                  ? order === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
                : undefined;
              return (
                <TableHead
                  key={c.key}
                  aria-sort={ariaSort}
                  className={cn(
                    c.align === "center" && "text-center",
                    c.align === "right" && "text-right",
                  )}
                >
                  {c.sortable ? (
                    <SortHeader
                      label={c.label}
                      field={c.key}
                      activeSort={sort}
                      activeOrder={order}
                      onSort={onSort}
                      className={cn(
                        c.align === "center" && "mx-auto",
                        c.align === "right" && "ml-auto",
                      )}
                    />
                  ) : (
                    c.label
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && rows.length === 0 ? (
            Array.from({ length: 6 }).map((_, i) => (
              <SkeletonRow key={i} cols={COLUMNS.length} />
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <EmptyTableRow
                columns={COLUMNS}
                text="No suspicious activity in this range — your team is clean."
              />
            </TableRow>
          ) : (
            rows.map((row) => (
              <SummaryRow
                key={row.user.id}
                row={row}
                onView={onView}
                isSelected={selectedUserId === row.user.id}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export const SuspensionsTable = memo(SuspensionsTableImpl);
