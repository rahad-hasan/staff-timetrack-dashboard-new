"use client";

import { useCallback, useRef, type ReactNode, type RefObject } from "react";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useLatestRef } from "./useLatestRef";

export type SupportDialogSize = "sm" | "md" | "lg";

const SIZE_CLASS: Record<SupportDialogSize, string> = {
  sm: "sm:max-w-[440px]",
  md: "sm:max-w-[560px]",
  lg: "sm:max-w-[720px]",
};

export interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** read to screen readers (and shown unless `hideDescription`) */
  description?: string;
  hideDescription?: boolean;
  /** keeps the title for assistive tech only (the body draws its own heading) */
  hideTitle?: boolean;
  children: ReactNode;
  /** the actions row; rendered in a `DialogFooter` */
  footer?: ReactNode;
  /**
   * A request is in flight: the X is hidden, Escape and outside clicks are
   * ignored and `onOpenChange(false)` is swallowed — a half-sent form never
   * closes under the user.
   */
  busy?: boolean;
  size?: SupportDialogSize;
  /** element to focus when the dialog opens (defaults to the first focusable) */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /**
   * Where focus goes on close when the element that opened the dialog is gone (e.g. the first-use
   * "Create ticket" that the table replaces once the ticket exists). Normally focus returns to the
   * opener itself — see `onCloseAutoFocus` below.
   */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /**
   * The same fallback, resolved at close time (after `returnFocusRef`): for a dialog that opens on
   * its own — the rating popup auto-opens on a resolve, usually with nothing focused — and whose
   * landing spot depends on the layout and on what the dialog changed (the visible "Rate this
   * ticket" button, else the ticket title). Without one, focus would fall to <body>.
   */
  returnFocusTo?: () => HTMLElement | null;
  className?: string;
  contentClassName?: string;
}

/** The first control Radix itself would focus (document order; roving radios expose one tab stop). */
const TABBABLE =
  'button:not([disabled]):not([tabindex="-1"]), [href]:not([tabindex="-1"]), input:not([disabled]):not([type="hidden"]):not([tabindex="-1"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Connected and rendered — `focus()` on a detached or `display: none` element is a silent no-op. */
const canTakeFocus = (element: HTMLElement | null | undefined): element is HTMLElement =>
  !!element && element.isConnected && element.getClientRects().length > 0;

/**
 * Focus return for a Radix dialog opened WITHOUT a `Dialog.Trigger` (every support dialog is
 * controlled): Radix would return focus to its empty trigger ref, i.e. <body>. Spread the two
 * handlers on the dialog's Content — `onOpenAutoFocus` captures the element that had focus before
 * Radix moves it inside, `onCloseAutoFocus` (after the exit animation, once the content is gone)
 * puts it back, or on `fallback()` when the opener is gone or never existed.
 */
export function useOpenerFocus(
  fallback?: () => HTMLElement | null,
  options: { preventScroll?: boolean } = {},
) {
  const openerRef = useRef<HTMLElement | null>(null);
  const fallbackRef = useLatestRef(fallback);
  const { preventScroll = false } = options;
  const onOpenAutoFocus = useCallback(() => {
    const active = document.activeElement;
    openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
  }, []);
  const onCloseAutoFocus = useCallback(
    (event: Event) => {
      event.preventDefault();
      const opener = openerRef.current;
      openerRef.current = null;
      const target = canTakeFocus(opener) ? opener : (fallbackRef.current?.() ?? null);
      if (canTakeFocus(target)) target.focus({ preventScroll });
    },
    [fallbackRef, preventScroll],
  );
  return { openerRef, onOpenAutoFocus, onCloseAutoFocus };
}

/**
 * Radix dialog (the app's shadcn `ui/dialog`) with the support chrome: 16px
 * radius like the drawn cards, 24px padding, 18px/500 title (the support
 * type scale has no bold), focus trap + `aria-modal` + labelled/described
 * by Radix, focus returned to the trigger on close, Escape closes (unless
 * busy), body scroll locked. No dialog is drawn in the user-portal PNGs;
 * this is the house pattern the create modal and the rating popup share.
 */
export const SupportDialog = ({
  open,
  onOpenChange,
  title,
  description,
  hideDescription = false,
  hideTitle = false,
  children,
  footer,
  busy = false,
  size = "md",
  initialFocusRef,
  returnFocusRef,
  returnFocusTo,
  className,
  contentClassName,
}: SupportDialogProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  // Fallbacks when the opener is gone: the caller's ref, then its resolver (both read at close time).
  const opener = useOpenerFocus(() => {
    const fallback = returnFocusRef?.current ?? null;
    if (canTakeFocus(fallback)) return fallback;
    return returnFocusTo?.() ?? null;
  });
  const handleOpenChange = (next: boolean) => {
    if (!next && busy) return;
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        ref={contentRef}
        showCloseButton={!busy}
        aria-busy={busy || undefined}
        onInteractOutside={(event) => {
          if (busy) event.preventDefault();
        }}
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault();
        }}
        onOpenAutoFocus={(event) => {
          opener.onOpenAutoFocus();
          // Opened without an opener (the rating popup auto-opens on a resolve): no user input led
          // here, so Chrome does not match :focus-visible on the programmatic focus and a keyboard
          // user cannot see where focus is (step-9a review, WCAG 2.4.7). Ask for the ring
          // explicitly (`focusVisible`, Chrome 122+ / Firefox 104+; ignored elsewhere).
          const autoOpened = opener.openerRef.current === null;
          const target =
            initialFocusRef?.current ??
            (autoOpened ? contentRef.current?.querySelector<HTMLElement>(TABBABLE) ?? null : null);
          if (target) {
            event.preventDefault();
            target.focus(autoOpened ? ({ focusVisible: true } as FocusOptions) : undefined);
            // Chrome ignores `focusVisible` (live check: :focus-visible stayed false), so the
            // support focus ring also answers to `[data-focus-ring]:focus` (tokens FOCUS_RING),
            // set here until the element loses focus or the pointer is used.
            if (autoOpened && !target.matches(":focus-visible")) {
              target.setAttribute("data-focus-ring", "");
              const clear = () => {
                target.removeAttribute("data-focus-ring");
                target.removeEventListener("blur", clear);
                target.removeEventListener("pointerdown", clear);
              };
              target.addEventListener("blur", clear);
              target.addEventListener("pointerdown", clear);
            }
          }
        }}
        // Radix returns focus to its Dialog.Trigger; these dialogs are controlled and opened without
        // one, so focus fell to <body> (integrator keyboard walk: Escape out of the create modal).
        onCloseAutoFocus={opener.onCloseAutoFocus}
        className={cn(
          "max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto rounded-2xl border-borderColor p-0 dark:border-darkBorder dark:bg-darkSecondaryBg",
          SIZE_CLASS[size],
          className,
        )}
      >
        <DialogHeader className={cn("px-6 pt-6", hideTitle && (hideDescription || !description) && "sr-only")}>
          <DialogTitle
            className={cn(
              "text-[18px] font-medium leading-7 text-headingTextColor dark:text-darkTextPrimary",
              hideTitle && "sr-only",
            )}
          >
            {title}
          </DialogTitle>
          {description ? (
            hideDescription ? (
              <VisuallyHidden.Root asChild>
                <DialogDescription>{description}</DialogDescription>
              </VisuallyHidden.Root>
            ) : (
              <DialogDescription className="text-[14px] leading-[22px] text-subTextColor dark:text-darkTextSecondary">
                {description}
              </DialogDescription>
            )
          ) : (
            // Radix warns (and screen readers lose context) without a description.
            <VisuallyHidden.Root asChild>
              <DialogDescription>{title}</DialogDescription>
            </VisuallyHidden.Root>
          )}
        </DialogHeader>
        <div className={cn("px-6 py-5", contentClassName)}>{children}</div>
        {footer ? (
          <DialogFooter className="gap-2.5 px-6 pb-6 sm:justify-end">{footer}</DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default SupportDialog;
