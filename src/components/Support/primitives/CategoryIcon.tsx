import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryRef } from "@/types/support";
import { CATEGORY_ICON_MAP, hexToRgba, resolveCategory, type ResolvedCategory } from "./tokens";

type CategoryLike = { category?: string | null; category_ref?: CategoryRef | null };
type CategoryInput = CategoryLike | Pick<CategoryRef, "slug" | "name" | "icon" | "color">;

const resolve = (value: CategoryInput): ResolvedCategory =>
  "icon" in value && "slug" in value && "color" in value
    ? value
    : resolveCategory(value as CategoryLike);

interface CategoryTileProps {
  /** a ticket (`category` + `category_ref`) or a category row (`GET /tickets/categories`) */
  category: CategoryInput;
  /** 44 in table rows, 26 in dropdown rows (measured) */
  size?: number;
  className?: string;
}

/**
 * Pastel square with the category glyph: background = the category colour
 * at 10% (measured: #0788f3 → #e6f3fe), icon = the colour itself.
 * Measured: 44px tile / radius 10 / 22px icon in rows; 26px / radius 6 /
 * 14px icon in the dropdown. Colour and icon are data (`category_ref`), so
 * an owner-created category renders without a release (§4.5).
 */
export const CategoryTile = ({ category, size = 44, className }: CategoryTileProps) => {
  const resolved = resolve(category);
  const Icon = CATEGORY_ICON_MAP[resolved.icon] ?? CATEGORY_ICON_MAP.question;
  const large = size >= 40;
  const iconSize = large ? Math.round(size * 0.5) : Math.round(size * 0.54);
  return (
    <span
      aria-hidden="true"
      data-category={resolved.slug}
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
      style={{
        width: size,
        height: size,
        borderRadius: large ? 10 : 6,
        backgroundColor: hexToRgba(resolved.color, 0.1),
        color: resolved.color,
      }}
    >
      <Icon size={iconSize} strokeWidth={large ? 1.75 : 2} />
    </span>
  );
};

interface CategoryChipProps extends CategoryTileProps {
  /** text class override (default = the dropdown row: 14px/400 heading colour) */
  labelClassName?: string;
}

/** Tile + name — the category dropdown row and the create form's picker (10px gap, measured). */
export const CategoryChip = ({ category, size = 26, className, labelClassName }: CategoryChipProps) => {
  const resolved = resolve(category);
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <CategoryTile category={category} size={size} />
      <span
        className={cn(
          "truncate text-[14px] leading-5 text-headingTextColor dark:text-darkTextPrimary",
          labelClassName,
        )}
      >
        {resolved.name}
      </span>
    </span>
  );
};

/**
 * The "All categories" row glyph: a 16px sliders icon in a 16px slot, no
 * tile (UP-Category: its label starts 10px left of the tiled rows' labels).
 */
export const AllCategoriesIcon = ({ className }: { className?: string }) => (
  <span
    aria-hidden="true"
    className={cn(
      "inline-flex size-4 shrink-0 items-center justify-center text-subTextColor dark:text-darkTextSecondary",
      className,
    )}
  >
    <SlidersHorizontal size={16} strokeWidth={2} />
  </span>
);

export default CategoryTile;
