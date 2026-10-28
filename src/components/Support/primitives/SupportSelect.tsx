"use client";

import { useCallback, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "./tokens";

/**
 * The support dropdown chrome (Radix Select), shared by the list's filter dropdowns and the create
 * form's category picker — measured on UP-Status / UP-Category at 1440 (2× ÷ 2):
 * - trigger 44 tall, radius 8, 1px #dce3e3; open / focused: #0788f3 border + the shared outline;
 * - panel 8 below the trigger, radius 10, 1px #dce3e3, soft two-layer shadow, 6px padding, rows
 *   2px apart; a highlighted / selected row is #f3f5f5 (+ 500 weight when selected).
 */

/**
 * Radix moves focus into the list programmatically, which Chrome may treat as :focus-visible even
 * after a mouse open. The keyboard ring on the highlighted option therefore follows the real input
 * modality: a key press on the trigger or in the list sets `data-kbd` on the panel, pointer
 * movement clears it (`[[data-kbd]_&]:` styles the options).
 */
export const useKeyboardModality = () => {
  const keyboardRef = useRef(false);
  const onTriggerKeyDown = useCallback(() => {
    keyboardRef.current = true;
  }, []);
  const onTriggerPointerDown = useCallback(() => {
    keyboardRef.current = false;
  }, []);
  const contentRef = useCallback((node: HTMLDivElement | null) => {
    if (node && keyboardRef.current) node.setAttribute("data-kbd", "");
  }, []);
  const onContentKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    event.currentTarget.setAttribute("data-kbd", "");
  }, []);
  const onContentPointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" || event.pointerType === "pen") event.currentTarget.removeAttribute("data-kbd");
  }, []);
  return {
    trigger: { onKeyDown: onTriggerKeyDown, onPointerDown: onTriggerPointerDown },
    content: { ref: contentRef, onKeyDown: onContentKeyDown, onPointerMove: onContentPointerMove },
  };
};

export type KeyboardModality = ReturnType<typeof useKeyboardModality>;

/** Keyboard ring of the highlighted option (only while the panel is keyboard-driven). */
export const OPTION_KEYBOARD_RING = "[[data-kbd]_&]:data-[highlighted]:shadow-[inset_0_0_0_1px_#0788f3]";

/** The trigger box (the caller adds its padding-left, fill and resting border colour). */
export const SELECT_TRIGGER_CLASS = cn(
  "group/trigger flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border bg-white pr-3 text-left outline-none transition-[border-color,background-color,box-shadow] duration-150",
  // the shared solid outline + a blue border (the drawn /20 ring measured 1.28:1 — step-9a review)
  "focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-60",
  FOCUS_RING,
  "data-[state=open]:border-primary",
);

/** One option row (the caller adds its height and any gap). */
export const SELECT_ROW_CLASS = cn(
  "relative flex shrink-0 cursor-default select-none items-center rounded-[6px] px-[10px] text-[14px] leading-5 text-headingTextColor outline-none",
  "data-[highlighted]:bg-support-surface-muted data-[state=checked]:bg-support-surface-muted data-[state=checked]:font-medium",
  OPTION_KEYBOARD_RING,
  "dark:text-darkTextPrimary dark:data-[highlighted]:bg-white/10 dark:data-[state=checked]:bg-white/10",
);

interface SelectPanelProps {
  modality: KeyboardModality;
  align: "start" | "end";
  /** width, z-index and max height of this panel */
  className?: string;
  children: ReactNode;
}

/** The dropdown panel: portal, popper position 8px below the trigger, the shared chrome, the row stack. */
export const SelectPanel = ({ modality, align, className, children }: SelectPanelProps) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      {...modality.content}
      position="popper"
      side="bottom"
      align={align}
      sideOffset={8}
      collisionPadding={16}
      className={cn(
        "overflow-hidden rounded-[10px] border border-borderColor bg-white p-[6px]",
        "shadow-[0_8px_24px_-4px_rgba(15,22,19,0.12),0_2px_6px_rgba(15,22,19,0.05)]",
        "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
        "dark:border-darkBorder dark:bg-darkSecondaryBg",
        className,
      )}
    >
      <SelectPrimitive.Viewport className="flex flex-col gap-[2px]">{children}</SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
);
