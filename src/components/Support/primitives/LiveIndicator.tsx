"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type LiveStatus = "live" | "connecting" | "offline";

/** Grace before a not-yet-connected (or just dropped) socket reads "Offline" — the first connect takes ~0.1–1 s. */
export const LIVE_OFFLINE_GRACE_MS = 3000;

/**
 * The support socket's state as the pills show it: `connecting` while it has been down for less
 * than the grace period (the first render before SocketProvider connects, a quick reconnect), so
 * "Offline" never flashes; `offline` once it has been down longer.
 */
export function useLiveStatus(connected: boolean, graceMs: number = LIVE_OFFLINE_GRACE_MS): LiveStatus {
  const [graceOver, setGraceOver] = useState(false);
  useEffect(() => {
    if (connected) {
      setGraceOver(false);
      return;
    }
    // Every disconnect gets the same grace.
    const timer = setTimeout(() => setGraceOver(true), graceMs);
    return () => clearTimeout(timer);
  }, [connected, graceMs]);
  if (connected) return "live";
  return graceOver ? "offline" : "connecting";
}

interface LiveIndicatorProps {
  status: LiveStatus;
  /**
   * `glass` — the hero stats card (55×22, white/12, #5bf5a0 dot, 12px/500 white — 4.74:1 on the AA
   * glass); `surface` — a white card header (26px, green tint while live, grey once offline).
   */
  tone: "glass" | "surface";
  /** tooltip while live / connecting */
  liveTitle: string;
  /** tooltip once offline */
  offlineTitle: string;
  className?: string;
}

/** The one "● Live / Offline" pill of the support screens (REQ-U-17). */
export const LiveIndicator = ({ status, tone, liveTitle, offlineTitle, className }: LiveIndicatorProps) => {
  const offline = status === "offline";
  if (tone === "glass") {
    return (
      <span
        data-live={offline ? "offline" : "live"}
        title={offline ? offlineTitle : liveTitle}
        className={cn(
          "mb-[0.5px] inline-flex h-[22px] shrink-0 items-center gap-[6px] rounded-full bg-white/[0.12] pl-[9px] pr-[10px] text-[12px] font-medium leading-none text-white",
          className,
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "size-[7px] rounded-full transition-colors",
            offline ? "bg-white/45" : status === "live" ? "bg-[#5bf5a0]" : "bg-[#5bf5a0]/60",
          )}
        />
        {offline ? "Offline" : "Live"}
        <span className="sr-only">{offline ? " — live updates paused" : " updates"}</span>
      </span>
    );
  }
  return (
    <span
      data-live={offline ? "offline" : "live"}
      className={cn(
        "inline-flex h-[26px] items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium leading-none",
        offline
          ? "border-[#e5e7eb] bg-[#f3f4f6] text-subTextColor dark:border-white/15 dark:bg-white/5 dark:text-darkTextSecondary"
          : "border-[#b9f8cf] bg-[#f0fdf4] text-[#008236] dark:border-[#00c950]/40 dark:bg-[#00c950]/15 dark:text-[#7bf1a8]",
        className,
      )}
      title={offline ? offlineTitle : liveTitle}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-[7px] rounded-full",
          offline ? "bg-[#99a1af]" : status === "live" ? "bg-[#00c950]" : "bg-[#00c950]/60",
        )}
      />
      {offline ? "Offline" : "Live"}
    </span>
  );
};
