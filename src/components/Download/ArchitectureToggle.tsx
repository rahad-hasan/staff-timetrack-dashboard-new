"use client";

import { useRef } from "react";
import type { KeyboardEvent } from "react";

import { cn } from "@/lib/utils";
import type { TDownloadTargetId } from "@/types/releases";

import type { IPlatformVariant } from "./downloadTargets";

interface IArchitectureToggleProps {
  /** Describes the choice for screen readers, e.g. "Choose your macOS processor". */
  label: string;
  variants: IPlatformVariant[];
  selectedId: TDownloadTargetId;
  onSelect: (id: TDownloadTargetId) => void;
}

/**
 * Segmented control for picking a build variant (Apple Silicon vs Intel).
 *
 * Radio semantics rather than a row of `aria-pressed` toggle buttons: this is
 * one mutually-exclusive choice, not several independent on/off switches, and
 * a radiogroup is what tells a screen reader "2 of 2" instead of announcing two
 * unrelated pressed states. That contract also owes the user arrow-key
 * navigation and a single tab stop, both implemented below.
 */
const ArchitectureToggle = ({
  label,
  variants,
  selectedId,
  onSelect,
}: IArchitectureToggleProps) => {
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const backward = event.key === "ArrowLeft" || event.key === "ArrowUp";

    if (!forward && !backward) return;

    // Arrow keys own the selection inside a radiogroup, so stop the page from
    // scrolling underneath it.
    event.preventDefault();

    const nextIndex =
      (index + (forward ? 1 : -1) + variants.length) % variants.length;

    onSelect(variants[nextIndex].id);
    optionRefs.current[nextIndex]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1 rounded-lg border border-borderColor bg-bgSecondary p-1 dark:border-darkBorder dark:bg-darkSecondaryBg"
      style={{ gridTemplateColumns: `repeat(${variants.length}, minmax(0, 1fr))` }}
    >
      {variants.map((variant, index) => {
        const isSelected = variant.id === selectedId;

        return (
          <button
            key={variant.id}
            ref={(node) => {
              optionRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            // Roving tabindex: the group is a single tab stop and arrow keys
            // move within it.
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(variant.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "cursor-pointer rounded-md px-2 py-1.5 text-center transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isSelected
                ? "bg-white shadow-sm dark:bg-darkPrimaryBg"
                : "hover:bg-white/60 dark:hover:bg-darkPrimaryBg/60",
            )}
          >
            <span
              className={cn(
                "block text-xs font-semibold",
                isSelected
                  ? "text-headingTextColor dark:text-darkTextPrimary"
                  : "text-subTextColor dark:text-darkTextSecondary",
              )}
            >
              {variant.label}
            </span>
            <span className="block text-[10px] text-subTextColor dark:text-darkTextSecondary">
              {variant.hint}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ArchitectureToggle;
