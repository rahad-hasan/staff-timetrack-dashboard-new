import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SUPPORT_TONE_CLASS, type SupportTone } from "./tokens";

interface SupportAlertProps extends Omit<HTMLAttributes<HTMLDivElement>, "role"> {
  tone: SupportTone;
  /**
   * `box` — a bordered 8px-radius box, 13px/20, the glyph 2px below the first line's top (form
   * banners, the rating dialog's error, the category picker's load failure);
   * `strip` — the top band of a composer card: a bottom border only, 13.5px, the glyph centred.
   */
  layout?: "box" | "strip";
  /** 16px leading glyph (lucide element; marked `aria-hidden` here) */
  icon?: ReactNode;
  /** a trailing control (Retry …) */
  action?: ReactNode;
  /** `alert` for an error that appears after an action; omit inside an `aria-live` container */
  role?: "alert" | "status";
}

const LAYOUT = {
  box: { root: "flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-[13px] leading-5", icon: "mt-0.5" },
  strip: {
    root: "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-t-xl border-b px-4 py-2.5 text-[13.5px] leading-5",
    icon: "",
  },
} as const;

/**
 * The inline message box of the support screens: the tone's border / tint / text
 * (`SUPPORT_TONE_CLASS`, one source for every error and info box) in one of two layouts.
 * Size tweaks (a field-height row, tighter padding) go through `className`.
 */
export const SupportAlert = ({ tone, layout = "box", icon, action, role, className, children, ...rest }: SupportAlertProps) => (
  <div role={role} className={cn(LAYOUT[layout].root, SUPPORT_TONE_CLASS[tone], className)} {...rest}>
    {icon ? (
      <span aria-hidden="true" className={cn("flex shrink-0 [&>svg]:size-4", LAYOUT[layout].icon)}>
        {icon}
      </span>
    ) : null}
    <div className="min-w-0 flex-1">{children}</div>
    {action}
  </div>
);
