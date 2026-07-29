"use client";

import { Star } from "lucide-react";
import { KeyboardEvent, useState } from "react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
  className?: string;
  ariaLabel?: string;
}

const StarRating = ({
  value,
  onChange,
  readOnly = false,
  size = 22,
  className,
  ariaLabel = "Rate this ticket",
}: StarRatingProps) => {
  const [hover, setHover] = useState<number | null>(null);

  const displayValue = hover ?? value;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (readOnly || !onChange) return;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      onChange(Math.min(5, (value || 0) + 1));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      onChange(Math.max(1, (value || 1) - 1));
    } else if (event.key === "Home") {
      event.preventDefault();
      onChange(1);
    } else if (event.key === "End") {
      event.preventDefault();
      onChange(5);
    }
  };

  return (
    <div
      role={readOnly ? "img" : "radiogroup"}
      aria-label={ariaLabel}
      tabIndex={readOnly ? -1 : 0}
      onKeyDown={handleKeyDown}
      className={cn("inline-flex items-center gap-1 outline-none", className)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayValue;
        const commonProps = {
          size,
          strokeWidth: 1.75,
          className: cn(
            "transition-colors",
            filled
              ? "fill-amber-400 text-amber-400"
              : "text-slate-300 dark:text-slate-600",
          ),
        };

        if (readOnly) {
          return <Star key={star} {...commonProps} aria-hidden="true" />;
        }

        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(star)}
            onBlur={() => setHover(null)}
            className="cursor-pointer rounded p-0.5 focus-visible:outline-2 focus-visible:outline-primary"
          >
            <Star {...commonProps} />
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
