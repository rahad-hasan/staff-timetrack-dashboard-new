"use client";

import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { toast, type ExternalToast } from "sonner";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "./tokens";

export type SupportToastKind = "success" | "info" | "warning" | "error";

const KIND_STYLE: Record<SupportToastKind, { tile: string; icon: ReactNode }> = {
  success: {
    tile: "bg-[#f0fdf4] text-[#008236] dark:bg-[#00c950]/15 dark:text-[#7bf1a8]",
    icon: <CircleCheck size={18} strokeWidth={2} />,
  },
  info: {
    tile: "bg-support-primary-soft text-primary dark:bg-primary/20 dark:text-support-primary-text-dark",
    icon: <Info size={18} strokeWidth={2} />,
  },
  warning: {
    tile: "bg-[#fef9c2] text-[#bb4d00] dark:bg-[#f0b100]/15 dark:text-[#ffd230]",
    icon: <TriangleAlert size={18} strokeWidth={2} />,
  },
  error: {
    tile: "bg-[#fef2f2] text-[#c10007] dark:bg-[#fb2c36]/15 dark:text-[#ffa2a2]",
    icon: <CircleAlert size={18} strokeWidth={2} />,
  },
};

interface SupportToastCardProps {
  kind: SupportToastKind;
  title: string;
  description?: string;
  /** an optional action (e.g. "Open" on a new-reply toast) */
  action?: { label: string; onClick: () => void };
  onDismiss: () => void;
}

/**
 * The drawn toast (UP-Refreshed, measured 2× ÷ 2): 264×63 white card, 1px
 * #dce3e3 border, 12px radius, soft shadow, 14px padding (13 at the bottom —
 * the card is 63 tall, not 64), 32px icon tile (green-50 / green-700 18px
 * circle-check), 12px gap, title 14px/500 on a 16px line, body 13px/18px
 * #505553 directly under it, a 16px × in a 24px button 10px from the top
 * (centred on the title line) / 12px from the right. Rendered through
 * `toast.custom` so sonner keeps stacking, timers, pause-on-hover and its
 * live region; pinned bottom-right with sonner's 24px offset — exactly
 * where the mock draws it (24px from the viewport's bottom and right) — on
 * desktop; below 1024 px top-center (see `toastPosition`).
 */
export const SupportToastCard = ({ kind, title, description, action, onDismiss }: SupportToastCardProps) => {
  const style = KIND_STYLE[kind];
  return (
    // No role/aria-live here: sonner's <section aria-live="polite"> already
    // announces every added toast; a nested live region would read it twice.
    // Font: sonner's [data-sonner-toaster] sets `ui-sans-serif, system-ui…`,
    // so the card names the app's next/font family (html = Roboto, "Roboto
    // Fallback") — otherwise it renders in the system face, the drawn body line
    // wraps and the card grows from 264×63 to 264×82 (UP-Refreshed).
    <div
      data-kind={kind}
      className="relative flex min-h-[63px] w-full items-start gap-3 [font-family:Roboto,'Roboto_Fallback',sans-serif] rounded-xl border border-borderColor bg-white p-[14px] pb-[13px] pr-11 shadow-[0_10px_28px_-6px_rgba(15,22,19,0.14),0_2px_6px_rgba(15,22,19,0.04)] sm:w-[264px] dark:border-darkBorder dark:bg-darkSecondaryBg"
    >
      <span
        aria-hidden="true"
        className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", style.tile)}
      >
        {style.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium leading-4 text-headingTextColor dark:text-darkTextPrimary">{title}</p>
        {description ? (
          <p className="text-[13px] leading-[18px] text-subTextColor dark:text-darkTextSecondary">{description}</p>
        ) : null}
        {action ? (
          <button
            type="button"
            onClick={() => {
              action.onClick();
              onDismiss();
            }}
            className={cn("mt-1.5 rounded-sm text-[13px] font-medium leading-5 text-support-primary-text outline-none hover:underline dark:text-support-primary-text-dark", FOCUS_RING)}
          >
            {action.label}
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className={cn("absolute right-3 top-2.5 flex size-6 items-center justify-center rounded-md text-support-muted outline-none transition-colors hover:bg-support-surface-muted hover:text-headingTextColor dark:hover:bg-white/10 dark:hover:text-darkTextPrimary", FOCUS_RING)}
      >
        <X size={16} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  );
};

export interface SupportToastOptions extends Pick<ExternalToast, "duration" | "id"> {
  description?: string;
  action?: { label: string; onClick: () => void };
}

/**
 * Where a support toast goes. As drawn (UP-Refreshed) bottom-right on desktop. Below 1024 px the
 * pages are one column: a bottom toast lands on the ticket page's reply box and its "Send reply"
 * (full width on phones, over the right-hand Send on tablets — seen live: the first tap after a
 * "New reply" toast hit the toast) and on the list's pager, so it takes the app's own position,
 * top-center (`<Toaster position="top-center">` in app/layout.tsx). Read per toast, so a rotated
 * or resized window gets the right one.
 */
const toastPosition = (): "bottom-right" | "top-center" =>
  typeof window !== "undefined" && window.matchMedia?.("(max-width: 1023.98px)").matches
    ? "top-center"
    : "bottom-right";

const show = (kind: SupportToastKind, title: string, options: SupportToastOptions = {}) =>
  toast.custom(
    (id) => (
      <SupportToastCard
        kind={kind}
        title={title}
        description={options.description}
        action={options.action}
        onDismiss={() => toast.dismiss(id)}
      />
    ),
    {
      id: options.id,
      // A toast with an action stays 12 s (WCAG 2.2.1: keyboard and screen-reader users reach
      // sonner's region with Alt+T; 5 s was too short to act on "Open" / "View") — step-9a review.
      duration: options.duration ?? (options.action ? 12_000 : kind === "error" ? 8000 : 5000),
      // The mock pins support toasts bottom-right (the app's <Toaster> defaults to top-center).
      position: toastPosition(),
      unstyled: true,
      classNames: { toast: "!bg-transparent !border-0 !shadow-none !p-0 sm:!w-auto" },
    },
  );

/**
 * The app's toast pattern is sonner (`<Toaster>` in app/layout.tsx); support
 * screens call these so every toast has the drawn card. Each call returns
 * the toast id (pass `id` to replace an earlier one instead of stacking).
 *
 * `notifySupport.refreshed()` — REQ-U-16, after a manual Refresh even when nothing changed.
 * `notifySupport.success("Ticket created", { description: "TKT-000024" })` — REQ-U-18.
 */
export const notifySupport = {
  success: (title: string, options?: SupportToastOptions) => show("success", title, options),
  info: (title: string, options?: SupportToastOptions) => show("info", title, options),
  warning: (title: string, options?: SupportToastOptions) => show("warning", title, options),
  error: (title: string, options?: SupportToastOptions) => show("error", title, options),
  refreshed: () =>
    show("success", "All tickets loaded.", {
      description: "Your ticket list is up to date.",
      id: "support-refreshed",
    }),
  dismiss: (id?: string | number) => toast.dismiss(id),
};

export default notifySupport;
