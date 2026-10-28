"use client";

import { useEffect, useState } from "react";
import {
  formatAbsolute,
  formatRelativeTime,
  toDate,
  type RelativeTimeStyle,
} from "@/lib/supportFormat";

/* One interval for every RelativeTime on the page, running only while one is mounted. */
const subscribers = new Set<(now: number) => void>();
let ticker: ReturnType<typeof setInterval> | null = null;

const TICK_MS = 30_000;

const subscribe = (listener: (now: number) => void) => {
  subscribers.add(listener);
  if (!ticker) {
    ticker = setInterval(() => {
      const now = Date.now();
      subscribers.forEach((fn) => fn(now));
    }, TICK_MS);
  }
  return () => {
    subscribers.delete(listener);
    if (subscribers.size === 0 && ticker) {
      clearInterval(ticker);
      ticker = null;
    }
  };
};

/**
 * A shared "now" that advances every 30 s for every mounted consumer (one
 * interval per page, cleared when the last consumer unmounts). The initial
 * value is the render's own clock — the request time on the server, the
 * hydration time in the browser — so SSR labels are never computed from a
 * stale module-level timestamp.
 */
export const useRelativeNow = (): number => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    return subscribe(setNow);
  }, []);
  return now;
};

interface RelativeTimeProps {
  value: string | number | Date | null | undefined;
  /** "long" = the list vocabulary ("2 hours ago"); "short" = "12 min ago" (§4.4) */
  variant?: RelativeTimeStyle;
  /** text before the label, e.g. "Created " */
  prefix?: string;
  className?: string;
}

/**
 * `<time>` with the user-portal vocabulary ("2 hours ago", "yesterday",
 * "about 1 month ago"), the absolute date as its tooltip and accessible
 * description, re-rendered every 30 s. Server and client may disagree by a
 * minute or a time zone at hydration; `suppressHydrationWarning` covers the
 * text and the first client tick corrects it.
 */
export const RelativeTime = ({ value, variant = "long", prefix, className }: RelativeTimeProps) => {
  const now = useRelativeNow();
  const date = toDate(value);
  if (!date) return null;
  return (
    <time dateTime={date.toISOString()} title={formatAbsolute(date)} className={className} suppressHydrationWarning>
      {prefix}
      {formatRelativeTime(date, new Date(now), variant)}
    </time>
  );
};

export default RelativeTime;
