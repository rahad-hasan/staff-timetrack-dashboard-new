"use client";

import { useEffect, useRef, useState } from "react";
import { ITargetRect } from "@/types/onboarding";
import { resolveAnchor } from "./anchors";

export type TourTargetState =
  | { status: "idle"; rect: null; element: null }
  /** The anchor is not in the DOM yet — a route change or Suspense boundary. */
  | { status: "searching"; rect: null; element: null }
  | { status: "found"; rect: ITargetRect; element: HTMLElement }
  /**
   * Gave up. The gate skips the step rather than spotlighting nothing.
   *
   * Carries WHICH anchor was given up on, because the verdict outlives the
   * step for one render: when the gate advances past a missing step, its skip
   * effect re-runs with the new step while this state still says "missing"
   * (the reset to "searching" lands a commit later). Without the anchor to
   * compare against, that stale pass would swallow the next step unseen — and
   * on the last step it would end the whole tour for a target that was never
   * even searched.
   */
  | { status: "missing"; rect: null; element: null; anchor: string };

const IDLE: TourTargetState = { status: "idle", rect: null, element: null };
const SEARCHING: TourTargetState = {
  status: "searching",
  rect: null,
  element: null,
};

/**
 * How long to wait for an anchor before declaring it absent.
 *
 * It has to outlast the slowest legitimate appearance: a route change plus a
 * server component's Suspense boundary. `/project-management/projects` wraps
 * its hero section in `<Suspense fallback={null}>`, so the Add Project button
 * is genuinely missing from the DOM for as long as that fetch takes.
 */
const DEFAULT_TIMEOUT_MS = 6000;

/** Subpixel jitter is not movement — re-rendering on it would never stop. */
const rectsEqual = (a: ITargetRect, b: ITargetRect): boolean =>
  Math.abs(a.top - b.top) < 0.5 &&
  Math.abs(a.left - b.left) < 0.5 &&
  Math.abs(a.width - b.width) < 0.5 &&
  Math.abs(a.height - b.height) < 0.5 &&
  a.radius === b.radius;

/** Borrow the element's own corner radius so the hole traces its shape. */
const readRadius = (element: HTMLElement): number => {
  const raw = window.getComputedStyle(element).borderTopLeftRadius;
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? Math.min(parsed, 28) : 8;
};

const isOffscreen = (rect: DOMRect): boolean => {
  const margin = 80;
  return (
    rect.top < margin ||
    rect.left < 0 ||
    rect.bottom > window.innerHeight - margin ||
    rect.right > window.innerWidth
  );
};

/**
 * Track a `data-tour` anchor's viewport box for as long as `anchor` is set.
 *
 * Measured on every animation frame rather than with ResizeObserver + scroll
 * listeners. That sounds heavier than it is: the loop only runs while a tour
 * step is on screen, it reads one element, and it only calls `setState` when
 * the box actually moves — so a still page costs one `getBoundingClientRect`
 * per frame and zero renders. The reason it has to be a frame loop is that
 * everything the spotlight follows moves *without* firing an event: the
 * sidebar's 300ms width transition, framer-motion's height animation on an
 * expanding nav group, and smooth-scrolling the target into view.
 */
export function useTourTarget(
  anchor: string | null,
  options: { timeoutMs?: number } = {},
): TourTargetState {
  const { timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const [state, setState] = useState<TourTargetState>(IDLE);

  // Kept in a ref so changing it cannot restart the loop mid-step.
  const timeoutRef = useRef(timeoutMs);
  timeoutRef.current = timeoutMs;

  useEffect(() => {
    if (!anchor) {
      setState(IDLE);
      return;
    }

    setState(SEARCHING);

    let frame = 0;
    let deadline = performance.now() + timeoutRef.current;
    let element: HTMLElement | null = null;
    let scrolled = false;
    let lastRect: ITargetRect | null = null;

    const tick = () => {
      // `isConnected` catches the case that matters most: React replaced the
      // subtree (a route change, a table re-render) and the node we measured
      // is now detached. Re-resolving beats holding a stale reference.
      const found =
        element && element.isConnected ? element : resolveAnchor(anchor);

      if (!found) {
        element = null;
        scrolled = false;
        lastRect = null;

        if (performance.now() > deadline) {
          setState({ status: "missing", rect: null, element: null, anchor });
          return;
        }

        setState((prev) => (prev.status === "searching" ? prev : SEARCHING));
        frame = requestAnimationFrame(tick);
        return;
      }

      if (found !== element) {
        element = found;
        scrolled = false;
        // A fresh element gets a fresh grace period — it may still be
        // animating in from zero height.
        deadline = performance.now() + timeoutRef.current;
      }

      const box = found.getBoundingClientRect();

      if (!scrolled) {
        scrolled = true;
        if (isOffscreen(box)) {
          found.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }

      const next: ITargetRect = {
        top: box.top,
        left: box.left,
        width: box.width,
        height: box.height,
        radius: readRadius(found),
      };

      if (!lastRect || !rectsEqual(lastRect, next)) {
        lastRect = next;
        setState({ status: "found", rect: next, element: found });
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [anchor]);

  return state;
}
