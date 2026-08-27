"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ITargetRect } from "@/types/onboarding";

/**
 * The dark, blurred backdrop with a hole cut out around the current target.
 *
 * How the hole is made, because it is not obvious:
 *
 *  - `backdrop-filter` cannot have a hole. It applies to a whole element, so
 *    the blur is drawn as FOUR panels tiled around the target rather than one
 *    full-screen layer. Those panels are also the click shield — they take
 *    pointer events, the gap between them does not, which is precisely what
 *    lets the user click the highlighted button and nothing else.
 *  - The dark tint is a single element sitting inside the hole with a huge
 *    spread `box-shadow`. That paints everything outside it and leaves a
 *    genuinely rounded corner, which four rectangles cannot do.
 *
 * Both layers animate on plain numbers (top/left/width/height), so moving
 * between steps is a spring on four values rather than an interpolated SVG
 * path — smooth, and impossible to get wrong.
 *
 * The corner arcs get tint but no blur, since the square gap between the
 * panels is slightly larger than the rounded hole. At a 60% tint over a few
 * pixels of arc it is not visible.
 */

/** One spring for every layer, so nothing arrives out of step. */
const TRANSITION = {
  type: "spring" as const,
  stiffness: 320,
  damping: 34,
  mass: 0.7,
};

interface SpotlightOverlayProps {
  rect: ITargetRect | null;
  /** Extra breathing room around the measured box. */
  padding?: number;
  /** Overrides the target's own corner radius. */
  radius?: number;
  /**
   * Clicking the dimmed area. Left undefined the backdrop swallows the click,
   * which is the right default mid-tour: a stray click should not silently
   * cancel a walkthrough the user is halfway through.
   */
  onBackdropClick?: () => void;
  /** Draw the pulsing ring that points at the target. */
  pulse?: boolean;
}

export default function SpotlightOverlay({
  rect,
  padding = 8,
  radius,
  onBackdropClick,
  pulse = true,
}: SpotlightOverlayProps) {
  const box = rect
    ? {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        radius: radius ?? Math.max(rect.radius, 8),
      }
    : null;

  return (
    <div
      className="fixed inset-0 z-[9990]"
      // The wrapper itself must never eat clicks — only the four panels below
      // do, and only where they actually cover something.
      style={{ pointerEvents: "none" }}
      aria-hidden="true"
    >
      <AnimatePresence>
        {box ? (
          <motion.div
            key="spotlight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0"
            style={{ pointerEvents: "none" }}
          >
            {/* ── blur + click shield: four panels around the hole ── */}
            <motion.div
              className="absolute left-0 right-0 top-0 backdrop-blur-[3px]"
              style={{ pointerEvents: "auto" }}
              animate={{ height: Math.max(box.top, 0) }}
              transition={TRANSITION}
              onClick={onBackdropClick}
            />
            <motion.div
              className="absolute left-0 right-0 bottom-0 backdrop-blur-[3px]"
              style={{ pointerEvents: "auto" }}
              animate={{ top: box.top + box.height }}
              transition={TRANSITION}
              onClick={onBackdropClick}
            />
            <motion.div
              className="absolute left-0 backdrop-blur-[3px]"
              style={{ pointerEvents: "auto" }}
              animate={{
                top: box.top,
                height: box.height,
                width: Math.max(box.left, 0),
              }}
              transition={TRANSITION}
              onClick={onBackdropClick}
            />
            <motion.div
              className="absolute right-0 backdrop-blur-[3px]"
              style={{ pointerEvents: "auto" }}
              animate={{
                top: box.top,
                height: box.height,
                left: box.left + box.width,
              }}
              transition={TRANSITION}
              onClick={onBackdropClick}
            />

            {/* ── tint: one rounded rect casting shadow over everything else ── */}
            <motion.div
              className="absolute"
              style={{
                pointerEvents: "none",
                boxShadow: "0 0 0 9999px rgba(6, 10, 20, 0.62)",
              }}
              animate={{
                top: box.top,
                left: box.left,
                width: box.width,
                height: box.height,
                borderRadius: box.radius,
              }}
              transition={TRANSITION}
            />

            {/* ── the ring that says "here" ── */}
            {pulse && (
              <motion.div
                className="absolute border-2"
                style={{
                  pointerEvents: "none",
                  borderColor: "var(--primary)",
                }}
                animate={{
                  top: box.top,
                  left: box.left,
                  width: box.width,
                  height: box.height,
                  borderRadius: box.radius,
                  boxShadow: [
                    "0 0 0 0px color-mix(in srgb, var(--primary) 45%, transparent)",
                    "0 0 0 10px color-mix(in srgb, var(--primary) 0%, transparent)",
                  ],
                }}
                transition={{
                  ...TRANSITION,
                  boxShadow: {
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeOut",
                  },
                }}
              />
            )}
          </motion.div>
        ) : (
          // No target: a plain scrim. Used while the next step's anchor is
          // still mounting, so the screen never flashes back to normal
          // between steps.
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-[rgba(6,10,20,0.62)] backdrop-blur-[3px]"
            style={{ pointerEvents: "auto" }}
            onClick={onBackdropClick}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
