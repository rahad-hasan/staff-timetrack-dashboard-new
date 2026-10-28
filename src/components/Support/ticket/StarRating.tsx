"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOCUS_RING, SUPPORT_COLORS } from "@/components/Support/primitives";
import { RATING_GRADES, RATING_VALUES, toRating, type Rating } from "@/types/support";

interface StarRatingProps {
  /** 0 = nothing picked yet */
  value: Rating | 0;
  onChange: (value: Rating) => void;
  disabled?: boolean;
  /** star size in px (36 in the rating popup) */
  size?: number;
  /** id of the visible label ("How would you rate…") */
  labelledBy?: string;
  /** error text id when the field is invalid */
  describedBy?: string;
  invalid?: boolean;
}

/**
 * Five-star input as a WAI-ARIA radio group: one tab stop (roving
 * tabindex), ←/→/↑/↓ move and select, Home/End jump, 1–5 pick directly;
 * hover previews the value. Each radio is labelled "4 stars, Good" so the
 * grade is read with the number. Filled = amber-500; an empty star is a
 * #8a9190 outline on #f3f5f5 (`starInputEmpty*`, 3.21:1 — a required radio's
 * boundary needs 3:1, WCAG 1.4.11), not the #dce3e3 of the read-only
 * `RatingStars`.
 */
export const StarRating = ({
  value,
  onChange,
  disabled = false,
  size = 36,
  labelledBy,
  describedBy,
  invalid = false,
}: StarRatingProps) => {
  const [hover, setHover] = useState<Rating | null>(null);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const shown = hover ?? value;
  const focusIndex = value >= 1 ? value - 1 : 0;

  const select = (next: number) => {
    const clamped = toRating(next);
    onChange(clamped);
    refs.current[clamped - 1]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, star: Rating) => {
    if (disabled) return;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        event.preventDefault();
        select(star + 1 > 5 ? 1 : star + 1);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        event.preventDefault();
        select(star - 1 < 1 ? 5 : star - 1);
        break;
      case "Home":
        event.preventDefault();
        select(1);
        break;
      case "End":
        event.preventDefault();
        select(5);
        break;
      default:
        if (/^[1-5]$/.test(event.key)) {
          event.preventDefault();
          select(Number(event.key));
        }
    }
  };

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      aria-required="true"
      className="inline-flex items-center gap-1"
      onMouseLeave={() => setHover(null)}
    >
      {RATING_VALUES.map((star) => {
        const filled = star <= shown;
        const checked = star === value;
        const stroke = filled ? SUPPORT_COLORS.star : SUPPORT_COLORS.starInputEmptyStroke;
        const fill = filled ? SUPPORT_COLORS.star : SUPPORT_COLORS.starInputEmptyFill;
        return (
          <button
            key={star}
            ref={(node) => {
              refs.current[star - 1] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={`${star} ${star === 1 ? "star" : "stars"}, ${RATING_GRADES[star]}`}
            tabIndex={star - 1 === focusIndex ? 0 : -1}
            disabled={disabled}
            onClick={() => select(star)}
            onMouseEnter={() => !disabled && setHover(star)}
            onFocus={() => setHover(null)}
            onKeyDown={(event) => onKeyDown(event, star)}
            className={cn(
              "inline-flex items-center justify-center rounded-lg p-0.5 outline-none transition-transform duration-100",
              FOCUS_RING,
              "motion-safe:hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            <Star
              aria-hidden="true"
              size={size}
              strokeWidth={1.25}
              fill={fill}
              color={stroke}
              className={cn(!filled && "dark:fill-white/10 dark:stroke-white/55")}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
