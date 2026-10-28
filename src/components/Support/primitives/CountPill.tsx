import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SUPPORT_TONE_CLASS } from "./tokens";

/**
 * The small blue info pill (TD-01 "4 messages", the timeline day separator, the attachments
 * count): 24 tall, px 10, 12px, the info tone. Height / weight tweaks go through `className`.
 */
export const CountPill = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span
    className={cn(
      "inline-flex h-6 items-center rounded-full border px-2.5 text-[12px] leading-none",
      SUPPORT_TONE_CLASS.info,
      className,
    )}
  >
    {children}
  </span>
);
