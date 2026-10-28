"use client";

import { memo, useRef, type KeyboardEvent } from "react";
import { CircleX, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupportCategory, TicketCounts, TicketStatus } from "@/types/support";
import {
  AllCategoriesIcon,
  CategoryTile,
  FOCUS_RING_INSET,
  STATUS_ORDER,
  STATUS_TOKENS,
  StatusDot,
} from "@/components/Support/primitives";
import { isStatus } from "@/lib/supportGuards";
import { SUPPORT_LIMITS } from "@/zod/supportSchema";
import { ALL_VALUE, FilterOption, FilterSelect } from "./FilterSelect";

interface TicketFilterBarProps {
  searchText: string;
  onSearchTextChange: (text: string) => void;
  onSearchSubmit: () => void;
  onSearchClear: () => void;
  status: TicketStatus | undefined;
  onStatusChange: (status: TicketStatus | undefined) => void;
  categoryId: number | undefined;
  /** name for a category_id the visible list no longer has (deleted / hidden) */
  categoryLabel: string | null;
  onCategoryChange: (categoryId: number | undefined) => void;
  categories: SupportCategory[];
  counts: TicketCounts | null;
}

interface SearchFieldProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}

/**
 * "Search by title or ticket number" (UP-Default empty, UP-NoResults filled):
 * magnifier at 13, text at 37, #0788f3 border while focused or filled, a
 * CircleX clear control at right 12 once there is text. Debounced by the
 * caller (300 ms); Enter applies at once, Escape clears.
 */
const SearchField = ({ value, onChange, onSubmit, onClear }: SearchFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const filled = value.length > 0;

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      onSubmit();
    } else if (event.key === "Escape" && filled) {
      event.preventDefault();
      onClear();
    }
  };

  return (
    <div className="relative col-span-2 min-w-0 @min-[960px]/list:flex-1">
      <Search
        aria-hidden="true"
        size={16}
        strokeWidth={2}
        className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-support-muted"
      />
      <input
        ref={inputRef}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={SUPPORT_LIMITS.SEARCH_MAX}
        aria-label="Search by title or ticket number"
        placeholder="Search by title or ticket number"
        autoComplete="off"
        spellCheck={false}
        data-filled={filled || undefined}
        data-support-search
        className={cn(
          "h-11 w-full min-w-0 rounded-lg border bg-white pl-9 pr-10 text-[16px] leading-5 text-headingTextColor outline-none transition-[border-color,box-shadow] duration-150 sm:text-[14px]",
          // placeholder = the AA grey twin (#697170, 5.0:1); drawn #8a9190 read 3.21:1 (step-9a review)
          "placeholder:text-support-muted-text [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none",
          "border-borderColor hover:border-support-border-hover focus:border-primary focus:ring-[3px] focus:ring-primary/15 data-[filled]:border-primary",
          "dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary",
        )}
      />
      {filled ? (
        <button
          type="button"
          onClick={() => {
            onClear();
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className={cn(
            "absolute right-[6px] top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-support-muted outline-none transition-colors hover:text-subTextColor",
            FOCUS_RING_INSET,
          )}
        >
          <CircleX aria-hidden="true" size={16} strokeWidth={1.75} />
        </button>
      ) : null}
    </div>
  );
};

interface StatusFilterProps {
  status: TicketStatus | undefined;
  onStatusChange: (status: TicketStatus | undefined) => void;
  counts: TicketCounts | null;
}

/** UP-Status: "All statuses 7 ✓" + the five statuses with dots and counts; value state "● In progress". */
const StatusFilter = memo(({ status, onStatusChange, counts }: StatusFilterProps) => {
  const token = status ? STATUS_TOKENS[status] : null;
  return (
    <div className="min-w-0 @min-[960px]/list:w-[200px] @min-[960px]/list:shrink-0">
      <FilterSelect
        label="Filter by status"
        placeholder="All statuses"
        align="start"
        value={status ?? null}
        onValueChange={(next) => onStatusChange(next && isStatus(next) ? next : undefined)}
        triggerProps={{ "data-support-status-trigger": "" }}
        selected={
          token ? (
            <span className="flex min-w-0 items-center gap-2">
              <StatusDot status={token.value} size={8} />
              <span className="truncate text-[14px] font-medium leading-5 text-support-primary-text dark:text-support-primary-text-dark">{token.label}</span>
            </span>
          ) : null
        }
      >
        <FilterOption value={ALL_VALUE} text="All statuses" count={counts?.total} />
        {STATUS_ORDER.map((value) => (
          <FilterOption
            key={value}
            value={value}
            text={STATUS_TOKENS[value].label}
            leading={<StatusDot status={value} size={8} />}
            count={counts ? counts[value] : null}
          />
        ))}
      </FilterSelect>
    </div>
  );
});
StatusFilter.displayName = "StatusFilter";

interface CategoryFilterProps {
  categoryId: number | undefined;
  categoryLabel: string | null;
  onCategoryChange: (categoryId: number | undefined) => void;
  categories: SupportCategory[];
}

/** UP-Category: "All categories ✓" (sliders icon) + the visible categories as 26px tiles, end-aligned panel. */
const CategoryFilter = memo(({ categoryId, categoryLabel, onCategoryChange, categories }: CategoryFilterProps) => {
  const visibleCategory = categoryId !== undefined ? categories.find((c) => c.id === categoryId) : undefined;
  return (
    <div className="min-w-0 @min-[960px]/list:w-[220px] @min-[960px]/list:shrink-0">
      <FilterSelect
        label="Filter by category"
        placeholder="All categories"
        align="end"
        value={categoryId !== undefined ? String(categoryId) : null}
        onValueChange={(next) => {
          const id = next === null ? undefined : Number(next);
          onCategoryChange(id !== undefined && Number.isSafeInteger(id) && id > 0 ? id : undefined);
        }}
        triggerProps={{ "data-support-category-trigger": "" }}
        selected={
          categoryId !== undefined ? (
            <span className="flex min-w-0 items-center gap-2">
              {visibleCategory ? <CategoryTile category={visibleCategory} size={20} /> : null}
              <span className="truncate text-[14px] font-medium leading-5 text-support-primary-text dark:text-support-primary-text-dark">
                {visibleCategory?.name ?? categoryLabel ?? "Category"}
              </span>
            </span>
          ) : null
        }
      >
        <FilterOption value={ALL_VALUE} text="All categories" leading={<AllCategoriesIcon />} />
        {categories.map((category) => (
          <FilterOption
            key={category.id}
            value={String(category.id)}
            text={category.name}
            height={42}
            leading={<CategoryTile category={category} size={26} />}
          />
        ))}
        {categoryId !== undefined && !visibleCategory ? (
          // Keep the current (no longer visible) value selectable so the trigger can show it.
          <FilterOption
            value={String(categoryId)}
            text={categoryLabel ?? "Unavailable category"}
            height={42}
            className="text-subTextColor"
          />
        ) : null}
      </FilterSelect>
    </div>
  );
});
CategoryFilter.displayName = "CategoryFilter";

/**
 * Search + status + category (UP-Default / UP-Status / UP-Category /
 * UP-Filtered / UP-NoResults). At 1440: one 44px row, gap 12 — search flexes
 * (702), status 200, category 220. Under a 960px content width the search
 * takes row 1 and the two selects share row 2 (plan §6). The selects are
 * memoised, so typing re-renders only the input.
 */
export const TicketFilterBar = ({
  searchText,
  onSearchTextChange,
  onSearchSubmit,
  onSearchClear,
  status,
  onStatusChange,
  categoryId,
  categoryLabel,
  onCategoryChange,
  categories,
  counts,
}: TicketFilterBarProps) => (
  <div
    role="search"
    aria-label="Filter tickets"
    data-support-filters
    className="grid grid-cols-2 gap-3 @min-[960px]/list:flex @min-[960px]/list:items-center"
  >
    <SearchField value={searchText} onChange={onSearchTextChange} onSubmit={onSearchSubmit} onClear={onSearchClear} />
    <StatusFilter status={status} onStatusChange={onStatusChange} counts={counts} />
    <CategoryFilter
      categoryId={categoryId}
      categoryLabel={categoryLabel}
      onCategoryChange={onCategoryChange}
      categories={categories}
    />
  </div>
);

export default TicketFilterBar;
