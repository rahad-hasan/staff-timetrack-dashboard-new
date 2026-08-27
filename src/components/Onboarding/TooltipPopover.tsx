"use client";

import { useRef } from "react";
import {
  FloatingArrow,
  FloatingPortal,
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
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
      arrow({ element: arrowRef, padding: 12 }),
    ],
  });

  const isLast = index === total - 1;

  // Bubbles enter from the side they are anchored on, so the motion reads as
  // "coming out of the target" instead of drifting in from nowhere.
  const side = placement.split("-")[0];
  const enterOffset =
    side === "top"
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
          ref={refs.setFloating}
          style={{ ...floatingStyles, zIndex: 9995 }}
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
