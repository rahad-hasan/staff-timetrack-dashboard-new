"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useEffect, type ComponentType } from "react";
import { loadOrReload } from "@/lib/lazyChunk";
import { cn } from "@/lib/utils";

/*
 * The calendars of the date pickers that sit in a page's filter bar or inline
 * form, loaded when their popover first opens.
 *
 * react-day-picker (about 15 kB gzipped with its time-zone helper) used to be
 * part of the first load of every page with such a picker, for a calendar
 * that is not on screen until the picker is clicked. The pickers' triggers
 * call the matching `warm…` function on hover and focus, so the chunk has
 * normally arrived by the time the popover opens; the placeholder — the size
 * of the month grid, so the popover does not change shape — covers a click
 * that beats it.
 *
 * Calendars inside form dialogs keep importing `ui/calendar` directly: those
 * dialogs are lazy chunks themselves.
 */

/** A month grid with five week rows, as `Calendar` draws it (p-3, 2rem cells). */
const MONTH_BOX = "h-[291px] w-[248px]";

function CalendarPlaceholder({ className }: { className: string }) {
  return (
    <div
      role="status"
      aria-label="Loading calendar"
      className={cn("flex items-center justify-center", className)}
    >
      <Loader2 className="size-5 animate-spin text-primary" />
    </div>
  );
}

/** What Radix's focus scope treats as a tab stop, in document order. */
const TAB_STOPS =
  'button:not([disabled]):not([tabindex="-1"]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * A popover moves focus to its first tab stop as it opens — with the calendar
 * inside from the start, that was the calendar's "previous month" button.
 * Opening on the placeholder there is no tab stop yet, so Radix parks focus
 * on the popover itself. When the calendar then mounts, hand focus on to
 * where it would have gone, unless the user has already moved it elsewhere.
 */
function useAdoptPopoverFocus() {
  useEffect(() => {
    const parked = document.activeElement;
    if (
      parked instanceof HTMLElement &&
      parked.matches('[data-slot="popover-content"]') &&
      parked.querySelector('[data-slot="calendar"]')
    ) {
      parked
        .querySelector<HTMLElement>(TAB_STOPS)
        ?.focus({ preventScroll: true });
    }
  }, []);
}

function withPopoverFocus<P extends object>(Calendar: ComponentType<P>) {
  return function CalendarInPopover(props: P) {
    useAdoptPopoverFocus();
    return <Calendar {...props} />;
  };
}

const importCalendar = () => import("@/components/ui/calendar");
const loadCalendar = loadOrReload(() =>
  importCalendar().then((module) => withPopoverFocus(module.Calendar)),
);

const importCalendarForDOB = () => import("@/components/ui/customCalendarForDOB");
const loadCalendarForDOB = loadOrReload(() =>
  importCalendarForDOB().then((module) =>
    withPopoverFocus(module.CustomCalendarForDOB),
  ),
);

/** `Calendar` for a single-month popover. */
export const LazyCalendar = dynamic(loadCalendar, {
  ssr: false,
  loading: () => <CalendarPlaceholder className={MONTH_BOX} />,
});

/** `Calendar` for a two-month popover (`numberOfMonths={2}`: side by side from `md`). */
export const LazyRangeCalendar = dynamic(loadCalendar, {
  ssr: false,
  loading: () => (
    <CalendarPlaceholder className={cn(MONTH_BOX, "md:w-[488px]")} />
  ),
});

/** `CustomCalendarForDOB` for a single-month popover. */
export const LazyCalendarForDOB = dynamic(loadCalendarForDOB, {
  ssr: false,
  loading: () => <CalendarPlaceholder className={MONTH_BOX} />,
});

// The raw imports, never the loaders above: a warm-up must not reload the page.
export const warmCalendar = () => {
  importCalendar().catch(() => {});
};

export const warmCalendarForDOB = () => {
  importCalendarForDOB().catch(() => {});
};
