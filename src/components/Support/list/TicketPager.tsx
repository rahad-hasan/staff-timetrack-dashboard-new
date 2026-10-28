"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FOCUS_RING } from "@/components/Support/primitives";

export type PagerItem = number | "gap-start" | "gap-end";

/**
 * Windowed page list: every page when they fit, else the first and last
 * page, `siblings` around the current one and a gap marker for each hidden
 * run (1 … 4 5 6 … 1000). Always the same number of slots for a given
 * total, so the pager never changes width while paging.
 */
export const pagerItems = (current: number, total: number, siblings = 1): PagerItem[] => {
  const slots = siblings * 2 + 5; // first, last, current, two gaps and the siblings
  if (total <= slots) return Array.from({ length: total }, (_, index) => index + 1);
  const run = slots - 2; // numbers shown next to a single gap
  // Near the start: 1 … run, gap, last — a gap never hides just one page.
  if (current + siblings <= run) {
    return [...Array.from({ length: run }, (_, index) => index + 1), "gap-end", total];
  }
  // Near the end: first, gap, the last `run` pages.
  if (current - siblings >= total - run + 1) {
    return [1, "gap-start", ...Array.from({ length: run }, (_, index) => total - run + 1 + index)];
  }
  const middle = Array.from({ length: siblings * 2 + 1 }, (_, index) => current - siblings + index);
  return [1, "gap-start", ...middle, "gap-end", total];
};

interface TicketPagerProps {
  page: number;
  /** pages the API can serve (already capped at the deepest reachable page) */
  totalPages: number;
  onPageChange: (page: number) => void;
  /** fewer numbers for narrow footers */
  siblings?: number;
  /**
   * a page is loading: presses are ignored (`aria-disabled` + a click guard) but every button
   * keeps its look and stays focusable — never the native `disabled`, which drops keyboard focus
   * from the button just pressed to <body> (step-9a review, WCAG 2.4.3)
   */
  busy?: boolean;
  className?: string;
}

const squareBase = cn(
  "flex size-8 shrink-0 items-center justify-center rounded-lg border text-[12.5px] font-medium leading-none tabular-nums outline-none transition-colors duration-150 focus-visible:border-primary",
  FOCUS_RING,
);

/**
 * The drawn pager (UP-Default / UP-Page2 / UP-Filtered): 32px squares,
 * radius 8, 6px apart, 1px #dce3e3, digits 12.5/500 slate-700; the current
 * page filled #0788f3 with a white digit; a disabled arrow has a #eaeeee
 * border and a #dce0e0 chevron, an enabled one a slate-700 chevron. A
 * single page still shows "1" with both arrows disabled (REQ-U-06).
 *
 * Focus (WCAG 2.4.3): a pressed page button keeps focus through the load and
 * is the `aria-current` one afterwards. An arrow that reaches the first/last
 * page becomes disabled (as drawn), which would drop focus — so focus then
 * moves to the new current page button. Only the pager that was used moves
 * focus (the footer renders a compact and a full one; CSS shows one).
 */
export const TicketPager = ({
  page,
  totalPages,
  onPageChange,
  siblings = 1,
  busy = false,
  className,
}: TicketPagerProps) => {
  const total = Math.max(1, totalPages);
  const current = Math.min(Math.max(1, page), total);
  const items = pagerItems(current, total, siblings);
  // Edges only — a load in flight never restyles the arrows as disabled.
  const prevDisabled = current <= 1;
  const nextDisabled = current >= total;
  const navRef = useRef<HTMLElement>(null);
  /** this pager was pressed and the page it asked for has not landed yet */
  const pressedRef = useRef(false);

  const go = (target: number) => {
    if (busy || target === current || target < 1 || target > total) return;
    pressedRef.current = true;
    onPageChange(target);
  };

  // The new page landed: if focus fell out of this pager (a disabled arrow), put it on the current page.
  useEffect(() => {
    if (!pressedRef.current || busy) return;
    pressedRef.current = false;
    const nav = navRef.current;
    if (!nav || nav.getClientRects().length === 0) return;
    const active = document.activeElement;
    // Still on a live button of this pager (the pressed page is now the current one), or the user
    // moved on to something else: leave focus alone. Only a lost focus (<body>, or an arrow that
    // just became disabled) is moved.
    const lost = !active || active === document.body || (nav.contains(active) && (active as HTMLButtonElement).disabled);
    if (!lost) return;
    nav.querySelector<HTMLButtonElement>('button[aria-current="page"]')?.focus();
  }, [current, busy]);

  const arrowClass = (off: boolean) =>
    cn(
      squareBase,
      off
        ? "cursor-not-allowed border-[#eaeeee] bg-white text-[#dce0e0] dark:border-darkBorder/60 dark:bg-transparent dark:text-white/25"
        : "border-borderColor bg-white text-support-slate hover:border-support-border-hover hover:bg-bgSecondary dark:border-darkBorder dark:bg-transparent dark:text-darkTextPrimary dark:hover:bg-white/5",
    );

  return (
    <nav ref={navRef} aria-label="Pagination" aria-busy={busy || undefined} className={cn("flex", className)}>
      <ul className="flex items-center gap-1.5">
        <li>
          <button
            type="button"
            aria-label="Previous page"
            disabled={prevDisabled}
            aria-disabled={busy || undefined}
            onClick={() => go(current - 1)}
            className={arrowClass(prevDisabled)}
          >
            <ChevronLeft aria-hidden="true" size={16} strokeWidth={2} />
          </button>
        </li>
        {items.map((item) =>
          typeof item === "number" ? (
            <li key={item}>
              <button
                type="button"
                aria-label={`Page ${item}`}
                aria-current={item === current ? "page" : undefined}
                aria-disabled={busy || undefined}
                onClick={() => go(item)}
                className={cn(
                  squareBase,
                  item === current
                    ? "border-support-primary-text bg-support-primary-text text-white"
                    : "border-borderColor bg-white text-support-slate hover:border-support-border-hover hover:bg-bgSecondary dark:border-darkBorder dark:bg-transparent dark:text-darkTextPrimary dark:hover:bg-white/5",
                  item > 999 && "w-auto min-w-8 px-1.5",
                )}
              >
                {item}
              </button>
            </li>
          ) : (
            <li key={item} aria-hidden="true" className="flex w-5 justify-center text-[12.5px] leading-none text-support-muted-text">
              …
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            aria-label="Next page"
            disabled={nextDisabled}
            aria-disabled={busy || undefined}
            onClick={() => go(current + 1)}
            className={arrowClass(nextDisabled)}
          >
            <ChevronRight aria-hidden="true" size={16} strokeWidth={2} />
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default TicketPager;
