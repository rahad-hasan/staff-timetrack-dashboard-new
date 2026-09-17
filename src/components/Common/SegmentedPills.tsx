"use client";

import {
  createElement,
  isValidElement,
  ReactNode,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
} from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SegmentedPillOption<TValue extends string | number> {
  value: TValue;
  label: string;
  /** Small trailing chip — "Save 20%", a count, a hint. */
  badge?: string;
  icon?: ReactNode | LucideIcon;
  disabled?: boolean;
}

type SegmentedPillsDomProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "onChange" | "role" | "children"
>;

export type SegmentedPillsActivation = "automatic" | "manual";

interface SegmentedPillsProps<
  TValue extends string | number,
> extends SegmentedPillsDomProps {
  options: ReadonlyArray<SegmentedPillOption<TValue>>;
  value: TValue | null;
  onChange: (value: TValue) => void;
  outline?: boolean;
  /** Controls whether the border/ring is shown. Defaults to true. */
  border?: boolean;
  ariaLabel: string;
  activation?: SegmentedPillsActivation;
  disabled?: boolean;
  size?: "sm" | "md";
  variant?: "segmented" | "loose";
  fill?: boolean;
}

const SegmentedPills = <TValue extends string | number>({
  options,
  value,
  onChange,
  ariaLabel,
  activation = "automatic",
  disabled,
  size = "md",
  variant = "segmented",
  fill = false,
  className,
  outline = false,
  border = true,
  style,
  "aria-labelledby": ariaLabelledBy,
  onBlur: onBlurProp,
  ...groupProps
}: SegmentedPillsProps<TValue>) => {
  const pillRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const isEnabled = (index: number) => {
    const option = options[index];
    return Boolean(option) && !disabled && !option.disabled;
  };

  const selectedIndex = options.findIndex((option) => option.value === value);
  const tabStopIndex = isEnabled(focusedIndex)
    ? focusedIndex
    : isEnabled(selectedIndex)
      ? selectedIndex
      : options.findIndex((_, index) => isEnabled(index));

  const stepTo = (from: number, delta: 1 | -1) => {
    const count = options.length;
    for (let offset = 1; offset <= count; offset += 1) {
      const index = (((from + delta * offset) % count) + count) % count;
      if (isEnabled(index)) return index;
    }
    return -1;
  };

  const moveTo = (index: number) => {
    if (index < 0) return;
    pillRefs.current[index]?.focus();
    if (activation === "manual") return;
    const option = options[index];
    if (option.value !== value) onChange(option.value);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let target: number;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        target = stepTo(index, 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        target = stepTo(index, -1);
        break;
      case "Home":
        target = stepTo(-1, 1);
        break;
      case "End":
        target = stepTo(0, -1);
        break;
      default:
        return;
    }

    event.preventDefault();
    moveTo(target);
  };

  const renderIcon = (icon: ReactNode | LucideIcon) => {
    if (!icon) return null;

    // Already a React element, e.g. <Package />
    if (isValidElement(icon)) {
      return icon;
    }

    // Lucide forwardRef component, e.g. Package
    if (typeof icon === "object" || typeof icon === "function") {
      return createElement(icon as LucideIcon, {
        className: "size-4",
      });
    }

    return icon;
  };

  return (
    <div
      {...groupProps}
      role="radiogroup"
      aria-label={ariaLabelledBy ? undefined : ariaLabel}
      aria-labelledby={ariaLabelledBy}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocusedIndex(-1);
        }
        onBlurProp?.(event);
      }}
      style={
        fill
          ? {
              gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
              ...style,
            }
          : style
      }
      className={cn(
        "items-center gap-2",
        fill ? "grid w-full" : "inline-flex flex-wrap",
        variant === "segmented" && "",
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = value === option.value;
        const Icon = option.icon;
        const isDisabled = disabled || option.disabled;

        return (
          <button
            key={String(option.value)}
            ref={(element) => {
              pillRefs.current[index] = element;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === tabStopIndex ? 0 : -1}
            disabled={isDisabled}
            onClick={() => {
              if (option.value !== value) onChange(option.value);
            }}
            onFocus={() => setFocusedIndex(index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md font-medium transition-all",
              "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
              "disabled:pointer-events-none disabled:opacity-50",
              fill ? "min-w-0" : "shrink-0",
              size === "sm"
                ? cn("h-8 text-[13px]", fill ? "px-1" : "px-2.5")
                : cn(
                    "h-9 text-[13px] sm:text-sm",
                    fill ? "px-1.5" : "px-3 sm:px-4",
                  ),
              variant === "loose" &&
                cn(
                  "gap-2 rounded-lg",
                  size === "md" && cn("h-11 text-sm", !fill && "px-4 sm:px-5"),
                  !selected &&
                    "hover:bg-bgSecondary dark:hover:bg-darkTertiaryBg",
                ),
              selected && outline
                ? cn(
                    "bg-primary/10 text-primary",
                    border ? "ring-1 ring-primary/50" : "ring-0",
                  )
                : selected
                  ? "bg-primary text-white shadow-sm dark:text-white"
                  : cn(
                      "text-subTextColor hover:text-headingTextColor dark:text-darkTextSecondary dark:hover:text-darkTextPrimary",
                      border
                        ? "ring-1 ring-borderColor dark:ring-darkBorder"
                        : "ring-0",
                    ),
            )}
          >
            {renderIcon(Icon)}

            {option.label}
            {option.badge && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] leading-none font-semibold",
                  selected
                    ? "bg-white/20 text-white"
                    : "bg-primary/10 text-primary dark:bg-primary/20",
                )}
              >
                {option.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default SegmentedPills;
