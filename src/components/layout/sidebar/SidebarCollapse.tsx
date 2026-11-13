"use client";

import { useEffect, useState, type ReactNode } from "react";
import clsx from "clsx";

interface SidebarCollapseProps {
  open: boolean;
  /**
   * How long the closing transition runs. The panel leaves the DOM after it,
   * so match the close duration in `className`.
   */
  exitMs: number;
  /** Duration and easing for this nav's transitions. */
  className?: string;
  children: ReactNode;
}

/**
 * Expand/collapse for a sidebar group, in CSS: a one-row grid animating
 * `grid-template-rows` between 0fr and 1fr (height to and from auto) plus a
 * fade. It replaced framer-motion, which shipped ~39 KB gzipped in every
 * authenticated page just for these accordions.
 *
 * It keeps the old `AnimatePresence initial={false}` contract:
 * - Mounted only while open and through the closing transition. A closed
 *   group must leave the DOM — in the collapsed rail its flyout is absolutely
 *   positioned, so nothing would clip a merely transparent one: it would still
 *   stretch the page and get its links prefetched as "visible".
 * - A group that is already open on the first render appears without
 *   animating; opening one later animates in from `@starting-style`.
 *
 * Children opt into the stagger with the `group/collapse` data attributes
 * (see SubItem). Reduced-motion users get instant open and close.
 */
export default function SidebarCollapse({
  open,
  exitMs,
  className,
  children,
}: SidebarCollapseProps) {
  const [present, setPresent] = useState(open);
  const [animateEnter, setAnimateEnter] = useState(!open);

  // Derived during render (React's "adjusting state when a prop changes"), so
  // an opening panel is in the DOM in the same commit as the click.
  if (open && !present) setPresent(true);
  if (!open && !animateEnter) setAnimateEnter(true);

  useEffect(() => {
    if (open) return;
    // A timer, not `transitionend`: that never fires under reduced motion or
    // inside the hidden (below-lg) rail, and would leave the panel mounted.
    const timer = window.setTimeout(() => setPresent(false), exitMs);
    return () => window.clearTimeout(timer);
  }, [open, exitMs]);

  if (!present) return null;

  return (
    <div
      // Out of the tab order and the accessibility tree while it closes.
      inert={!open}
      data-state={open ? "open" : "closed"}
      data-enter={animateEnter ? "" : undefined}
      className={clsx(
        "group/collapse grid transition-[grid-template-rows,opacity] motion-reduce:transition-none",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        animateEnter && "starting:grid-rows-[0fr] starting:opacity-0",
        className,
      )}
    >
      {/* min-h-0 + overflow-hidden let the row actually reach 0. */}
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
