"use client";

import { forwardRef } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SupportCategory } from "@/types/support";
import { CategoryChip, CategoryTile, FOCUS_RING, SupportAlert } from "@/components/Support/primitives";
import {
  SELECT_ROW_CLASS,
  SELECT_TRIGGER_CLASS,
  SelectPanel,
  useKeyboardModality,
} from "@/components/Support/primitives/SupportSelect";

interface CategoryPickerProps {
  categories: SupportCategory[];
  value: number | undefined;
  onChange: (id: number) => void;
  onBlur?: () => void;
  /** the categories endpoint failed — offer a retry instead of an empty menu */
  failed?: boolean;
  retrying?: boolean;
  onRetry?: () => void;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  "aria-describedby"?: string;
  /** set by `FormControl` */
  "aria-invalid"?: boolean | "true" | "false";
}

/**
 * Category picker of the create form (REQ-U-18: "categories visible to
 * users in their sort order", icon + colour from the data). The trigger,
 * the panel and the rows are the shared support select (`SupportSelect`) —
 * the drawn category dropdown's rows (26px tile, 10 gap, 14px label, 42 +
 * 2 gap) at the form's width.
 */
export const CategoryPicker = forwardRef<HTMLButtonElement, CategoryPickerProps>(
  (
    { categories, value, onChange, onBlur, failed, retrying, onRetry, disabled, invalid: invalidProp, id, ...aria },
    ref,
  ) => {
    const invalid = Boolean(invalidProp) || aria["aria-invalid"] === true || aria["aria-invalid"] === "true";
    const selected = categories.find((category) => category.id === value);
    const modality = useKeyboardModality();

    if (failed && categories.length === 0) {
      return (
        <SupportAlert
          role="alert"
          tone="error"
          className="h-11 items-center gap-3 py-0"
          action={
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className={cn("inline-flex items-center gap-1.5 rounded-sm font-medium text-support-primary-text outline-none hover:underline disabled:opacity-60 dark:text-support-primary-text-dark", FOCUS_RING)}
            >
              <RefreshCw aria-hidden="true" size={14} className={cn(retrying && "motion-safe:animate-spin")} />
              Retry
            </button>
          }
        >
          We couldn&apos;t load the categories.
        </SupportAlert>
      );
    }

    return (
      <SelectPrimitive.Root
        // "" = no value (Radix 2): stays controlled when a vanished category clears the pick (0).
        value={value !== undefined && value > 0 ? String(value) : ""}
        onValueChange={(next) => {
          const numeric = Number(next);
          if (Number.isSafeInteger(numeric) && numeric > 0) onChange(numeric);
        }}
        disabled={disabled}
        onOpenChange={(open) => {
          if (!open) onBlur?.();
        }}
      >
        <SelectPrimitive.Trigger
          {...modality.trigger}
          ref={ref}
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={aria["aria-describedby"]}
          data-support-category-picker
          className={cn(
            SELECT_TRIGGER_CLASS,
            "pl-2 dark:bg-darkPrimaryBg",
            invalid ? "border-[#e7000b]" : "border-borderColor hover:border-support-border-hover dark:border-darkBorder",
          )}
        >
          {selected ? (
            <CategoryChip category={selected} size={26} />
          ) : (
            <span className="truncate pl-1 text-[14px] leading-5 text-support-muted-text">Choose a category</span>
          )}
          <SelectPrimitive.Icon asChild>
            <ChevronDown
              aria-hidden="true"
              size={16}
              strokeWidth={2}
              className="shrink-0 text-subTextColor transition-transform duration-150 group-data-[state=open]/trigger:rotate-180"
            />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPanel
          modality={modality}
          align="start"
          className="z-[60] w-[var(--radix-select-trigger-width)] min-w-[240px] max-h-[min(360px,var(--radix-select-content-available-height))]"
        >
          {categories.map((category) => (
            <SelectPrimitive.Item
              key={category.id}
              value={String(category.id)}
              textValue={category.name}
              className={cn(SELECT_ROW_CLASS, "h-[42px] gap-2.5")}
            >
              <CategoryTile category={category} size={26} />
              {/* Radix names the option by its ItemText, so the label cannot sit inside a CategoryChip */}
              <SelectPrimitive.ItemText className="min-w-0 truncate">{category.name}</SelectPrimitive.ItemText>
              <SelectPrimitive.ItemIndicator className="ml-auto flex pl-3 text-primary">
                <Check aria-hidden="true" size={16} strokeWidth={2} />
              </SelectPrimitive.ItemIndicator>
            </SelectPrimitive.Item>
          ))}
        </SelectPanel>
      </SelectPrimitive.Root>
    );
  },
);

CategoryPicker.displayName = "CategoryPicker";

export default CategoryPicker;
