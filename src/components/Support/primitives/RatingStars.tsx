import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORT_COLORS } from "./tokens";

interface RatingStarsProps {
  /** 1–5, or null for the grey dash (unrated / not ratable yet) */
  rating: number | null | undefined;
  /**
   * star size in px — 13 in the table row: UP-Default draws 11 css px of star ink on a 14px pitch
   * (2x ink scan, integrator 2026-10-21; a 12px glyph inks 10), 18 on the ticket page
   */
  size?: number;
  /** gap between stars in px (1 in the table → the drawn 14px pitch) */
  gap?: number;
  className?: string;
}

/**
 * Read-only 5-star row (amber-500 filled / #dce3e3 empty) or the 9×1px grey
 * dash drawn for unrated tickets (UP-Default RATING column, REQ-U-14).
 */
export const RatingStars = ({ rating, size = 13, gap = 1, className }: RatingStarsProps) => {
  if (rating === null || rating === undefined || !Number.isFinite(rating) || rating < 1) {
    return (
      <span role="img" aria-label="Not rated" className={cn("inline-flex h-5 items-center", className)}>
        <span aria-hidden="true" className="block h-px w-[9px] bg-[#b8bebd] dark:bg-darkTextSecondary" />
      </span>
    );
  }
  const value = Math.min(5, Math.max(1, Math.round(rating)));
  return (
    <span
      role="img"
      aria-label={`Rated ${value} out of 5`}
      className={cn("inline-flex items-center", className)}
      style={{ gap }}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const color = filled ? SUPPORT_COLORS.star : SUPPORT_COLORS.starEmpty;
        return <Star key={star} aria-hidden="true" size={size} strokeWidth={1} fill={color} color={color} />;
      })}
    </span>
  );
};

export default RatingStars;
