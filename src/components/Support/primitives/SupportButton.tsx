"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOCUS_RING, FOCUS_RING_ON_BLUE, PRIMARY_BUTTON_GRADIENT } from "./tokens";

export type SupportButtonVariant = "primary" | "outline" | "hero" | "heroGhost" | "ghost" | "link";
export type SupportButtonSize = "sm" | "md" | "lg";

/**
 * Buttons as drawn (2× ÷ 2):
 * - `hero`      white, #3360c8 label — hero "+ Create ticket" (40 tall, px 16, 135 wide)
 * - `heroGhost` white/14 fill, 1px white/35 border, white label — hero "⟳ Refresh" (40, 106 wide)
 * - `primary`   #4483e5→#3260c8 vertical gradient, white label — the empty-state CTAs
 *               (First use `lg` 44 tall px 20 = 144 wide; No results `md` 40 tall px 14 = 132)
 * - `outline`   white, 1px #dce3e3, slate-700 label — "⊗ Clear filters" (40, px 14)
 * - `ghost` / `link` for secondary actions in dialogs and banners (not drawn; app tokens)
 * Shared: radius 8, 16px leading icon, 8px icon gap, 14px/500 label. Hover, active,
 * focus-visible, disabled and loading states are not in the PNGs; they follow the
 * same tokens. Focus = the shared solid 2px outline 2px outside (`FOCUS_RING`, 5.1:1),
 * white on the blue hero (`FOCUS_RING_ON_BLUE`); the drawn translucent rings measured
 * 1.3–1.9:1 (step-9a review). The hero ghost's fill is the deep-blue glass (`support-hero-glass`):
 * the drawn white/12 tint left its white label at ≈ 3.8:1.
 */
const VARIANT: Record<SupportButtonVariant, string> = {
  primary: cn(
    "text-white shadow-[0_1px_2px_rgba(15,22,19,0.08)] hover:brightness-[1.06] active:brightness-95 disabled:brightness-100",
    FOCUS_RING,
  ),
  outline: cn(
    "border border-borderColor bg-white text-support-slate hover:border-support-border-hover hover:bg-bgSecondary active:bg-[#eef1f1] focus-visible:border-primary dark:border-darkBorder dark:bg-transparent dark:text-darkTextPrimary dark:hover:bg-white/5",
    FOCUS_RING,
  ),
  hero: cn("bg-white text-[#3360c8] hover:bg-[#f2f6fe] active:bg-[#e8effc]", FOCUS_RING_ON_BLUE),
  heroGhost: cn(
    "border border-white/35 bg-support-hero-glass text-white hover:bg-support-hero-glass-hover active:bg-support-hero-glass-active",
    FOCUS_RING_ON_BLUE,
  ),
  ghost: cn(
    "text-support-slate hover:bg-support-surface-muted active:bg-[#eaeeee] dark:text-darkTextPrimary dark:hover:bg-white/5",
    FOCUS_RING,
  ),
  link: cn("h-auto px-0 text-support-primary-text underline-offset-4 hover:underline dark:text-support-primary-text-dark", FOCUS_RING),
};

const SIZE: Record<SupportButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-3.5 text-[14px]",
  lg: "h-11 px-5 text-[14px]",
};

export interface SupportButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: SupportButtonVariant;
  size?: SupportButtonSize;
  /** 16px leading icon (lucide element) */
  icon?: ReactNode;
  /**
   * Shows a spinner in place of the icon and sets `aria-busy` + `aria-disabled` (with a click
   * guard) — NOT the native `disabled`: a disabled button drops keyboard focus to <body> the
   * moment it is pressed (step-9a review, WCAG 2.4.3), so a busy button keeps focus instead.
   */
  loading?: boolean;
  /**
   * Not available right now (e.g. files still uploading) but keeps focus: `aria-disabled` + the
   * click guard of `loading`, without the spinner.
   */
  blocked?: boolean;
  /** render the child (e.g. a next/link) with the button styles */
  asChild?: boolean;
}

export const SupportButton = forwardRef<HTMLButtonElement, SupportButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      icon,
      loading = false,
      blocked = false,
      asChild = false,
      disabled,
      className,
      style,
      children,
      type,
      onClick,
      "aria-disabled": ariaDisabledProp,
      ...rest
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const isHeroSize = variant === "hero" || variant === "heroGhost";
    const held = loading || blocked;
    const leading = loading ? (
      <Loader2 aria-hidden="true" className="size-4 shrink-0 motion-safe:animate-spin" />
    ) : icon ? (
      <span aria-hidden="true" className="inline-flex size-4 shrink-0 items-center justify-center [&>svg]:size-4">
        {icon}
      </span>
    ) : null;
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : (type ?? "button")}
        disabled={asChild ? undefined : disabled}
        aria-busy={loading || undefined}
        aria-disabled={
          held || (asChild && disabled) || ariaDisabledProp === true || ariaDisabledProp === "true" ? true : undefined
        }
        onClick={(event) => {
          // Enter / Space still reach a focused aria-disabled button: guard here.
          if (held) {
            event.preventDefault();
            return;
          }
          onClick?.(event);
        }}
        className={cn(
          "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium leading-none outline-none transition-[background-color,border-color,filter,color] duration-150",
          "disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:pointer-events-none aria-disabled:opacity-60",
          SIZE[size],
          isHeroSize && "h-10 px-4",
          VARIANT[variant],
          className,
        )}
        style={variant === "primary" ? { backgroundImage: PRIMARY_BUTTON_GRADIENT, ...style } : style}
        {...rest}
      >
        {leading}
        {/* With asChild the child element (e.g. a next/link) becomes the root and keeps the icon inside. */}
        <Slottable>{children}</Slottable>
      </Comp>
    );
  },
);

SupportButton.displayName = "SupportButton";

export default SupportButton;
