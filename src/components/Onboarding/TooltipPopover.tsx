"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  FloatingArrow,
  FloatingPortal,
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  size,
  useFloating,
} from "@floating-ui/react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ITourStep } from "@/types/onboarding";
import BrandColorPreview from "./BrandColorPreview";

/**
 * The step bubble.
 *
 * Positioning is `@floating-ui/react` against the real target element rather
 * than a virtual rect: that way flip/shift see the same node the spotlight is
 * cutting around, and `autoUpdate` keeps the two in sync through scrolling and
 * the sidebar's width transition without a second measurement loop.
 *
 * `animationFrame: true` is on because several targets move under animation
 * rather than under an event — a nav group expanding with framer-motion never
 * fires scroll or resize, so a listener-based autoUpdate would leave the
 * bubble behind while the spotlight moved.
 */

interface TooltipPopoverProps {
  step: ITourStep;
  /** The spotlit element. Positioning is suspended while this is null. */
  element: HTMLElement | null;
  index: number;
  total: number;
  /** The step's milestone is already earned — shown live, no reload. */
  taskDone: boolean;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onJump: (index: number) => void;
}

const ARROW_HEIGHT = 8;

export default function TooltipPopover({
  step,
  element,
  index,
  total,
  taskDone,
  onNext,
  onPrev,
  onSkip,
  onJump,
}: TooltipPopoverProps) {
  const arrowRef = useRef<SVGSVGElement>(null);

  /**
   * When no anchored position can hold the whole bubble, it becomes a fixed
   * bottom sheet instead. A big target defeats floating-ui: `flip`'s only
   * alternative to "bottom" is "top", `shift` for a vertical placement only
   * corrects the cross axis — so with a target filling most of the screen
   * (the download finale's installer surface on a phone or a short laptop
   * window) every candidate clips the bubble, including the edge holding the
   * ONLY Finish and close controls.
   *
   * The verdict is not a heuristic about the target's height. The `size`
   * middleware reports the real space left for the bubble at the placement
   * flip settled on, re-evaluated on every reposition (`autoUpdate` with
   * `animationFrame: true` fires whenever the reference moves or either
   * element resizes), so the mode also reacts to what a one-shot measure
   * would miss: the Mac architecture accordion growing the spotlit wrapper
   * mid-step, a window resize, a phone rotating. The 24px band keeps the
   * boundary from oscillating.
   */
  const [sheet, setSheet] = useState(false);
  const sheetRef = useRef(false);

  // Each step starts anchored; its own first measurement decides otherwise.
  // Layout effect on purpose: it must run before floating-ui's first
  // positioning pass, or it would stomp the verdict that pass just made.
  useLayoutEffect(() => {
    sheetRef.current = false;
    setSheet(false);
  }, [element]);

  const { refs, floatingStyles, context, placement } = useFloating({
    placement: step.placement ?? "bottom",
    strategy: "fixed",
    elements: { reference: element },
    whileElementsMounted: (reference, floating, update) =>
      autoUpdate(reference, floating, update, { animationFrame: true }),
    middleware: [
      offset(ARROW_HEIGHT + 10),
      // `padding` keeps the bubble off the viewport edge on both axes — the
      // sidebar steps sit hard against the left edge and would otherwise be
      // clipped rather than shifted.
      flip({ padding: 16 }),
      shift({ padding: 16 }),
      size({
        padding: 16,
        apply({ availableHeight, elements }) {
          const needed = elements.floating.scrollHeight;
          const next = sheetRef.current
            ? availableHeight < needed + 24 // leave the sheet only for real room
            : availableHeight < needed;

          if (next !== sheetRef.current) {
            sheetRef.current = next;
            setSheet(next);
          }
        },
      }),
      arrow({ element: arrowRef, padding: 12 }),
    ],
  });

  const isLast = index === total - 1;

  // Bubbles enter from the side they are anchored on, so the motion reads as
  // "coming out of the target" instead of drifting in from nowhere. The
  // bottom-sheet fallback rises from the bottom edge it is pinned to.
  const side = placement.split("-")[0];
  const enterOffset = sheet
    ? { y: 8 }
    : side === "top"
      ? { y: 8 }
      : side === "bottom"
        ? { y: -8 }
        : side === "left"
          ? { x: 8 }
          : { x: -8 };

  return (
    <FloatingPortal>
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          // The floating ref stays attached in sheet mode: the `size`
          // middleware must keep measuring, or the bubble could never leave
          // the sheet when room comes back. Only the styles are overridden.
          ref={refs.setFloating}
          style={
            sheet
              ? {
                  // Centered by the width class + auto inline margins — no
                  // transform, which framer-motion owns for the animation.
                  position: "fixed",
                  left: 16,
                  right: 16,
                  top: "auto",
                  bottom: 16,
                  marginInline: "auto",
                  zIndex: 9995,
                }
              : { ...floatingStyles, zIndex: 9995 }
          }
          initial={{ opacity: 0, scale: 0.96, ...enterOffset }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          role="dialog"
          aria-live="polite"
          aria-label={step.title}
          className={cn(
            "w-[min(20rem,calc(100vw-2rem))] rounded-[12px] p-4",
            "bg-bgPrimary dark:bg-darkPrimaryBg",
            "border border-borderColor dark:border-darkBorder",
            "shadow-[0_18px_50px_-12px_rgba(6,10,20,0.45)]",
          )}
        >
          <FloatingArrow
            ref={arrowRef}
            context={context}
            height={ARROW_HEIGHT}
            width={ARROW_HEIGHT * 2}
            // Hidden, not unmounted, in sheet mode: the arrow middleware only
            // positions a mounted arrow, and an arrow remounted on the way
            // back to anchored mode would sit at a stale corner until the
            // next reposition — which a one-shot layout change (the Mac
            // accordion snapping shut) never delivers.
            style={{ visibility: sheet ? "hidden" : undefined }}
            // Fill and stroke are split so the arrow keeps the card's 1px
            // border along its two outer edges instead of looking pasted on.
            className="fill-bgPrimary dark:fill-darkPrimaryBg [&>path:first-of-type]:stroke-borderColor dark:[&>path:first-of-type]:stroke-darkBorder"
          />

          <div className="flex items-start justify-between gap-3">
            <span className="text-[11px] font-medium uppercase tracking-wide text-primary">
              Step {index + 1} of {total}
            </span>

            <button
              type="button"
              onClick={onSkip}
              aria-label="Close tour"
              className="-mr-1 -mt-1 rounded p-1 text-subTextColor hover:bg-gray-100 dark:text-darkTextSecondary dark:hover:bg-darkSecondaryBg cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          <h3 className="mt-1.5 text-base font-medium text-headingTextColor dark:text-darkTextPrimary">
            {step.title}
          </h3>

          <p className="mt-1.5 text-sm leading-relaxed text-subTextColor dark:text-darkTextSecondary">
            {step.body}
          </p>

          {/*
            Live feedback. When the user actually completes the action this
            step is teaching — while the tooltip is still open — the success
            handler marks the milestone and this flips without a reload.
          */}
          {step.task && taskDone && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-1.5 rounded-[8px] bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary"
            >
              <Check className="size-3.5" strokeWidth={3} />
              Done — nice work
            </motion.div>
          )}

          {step.preview === "brand-color" && <BrandColorPreview />}

          <div className="mt-4 flex items-center justify-between gap-3">
            {/* Dots double as navigation for anyone who wants to skip ahead. */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: total }).map((_, dot) => (
                <button
                  key={dot}
                  type="button"
                  onClick={() => onJump(dot)}
                  aria-label={`Go to step ${dot + 1}`}
                  aria-current={dot === index}
                  className={cn(
                    "h-1.5 rounded-full transition-all cursor-pointer",
                    dot === index
                      ? "w-4 bg-primary"
                      : "w-1.5 bg-borderColor dark:bg-darkBorder hover:bg-subTextColor",
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {index > 0 && (
                <Button variant="outline2" size="sm" onClick={onPrev}>
                  Back
                </Button>
              )}
              <Button size="sm" onClick={onNext}>
                {isLast ? "Finish" : "Next"}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </FloatingPortal>
  );
}
