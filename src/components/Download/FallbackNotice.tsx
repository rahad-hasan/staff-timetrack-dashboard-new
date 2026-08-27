"use client";

import { useEffect, useState } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import type { IReleaseError } from "@/types/releases";

interface IFallbackNoticeProps {
  error: IReleaseError;
  /** Release tag as published, e.g. `v1.0.4`. */
  tag: string;
  isRefreshing: boolean;
  onRetry: () => void;
}

const formatResetTime = (retryAt: number | null): string | null => {
  if (!retryAt) return null;

  const resetDate = new Date(retryAt * 1000);
  if (Number.isNaN(resetDate.getTime())) return null;

  return resetDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
};

const describe = (error: IReleaseError): string => {
  switch (error.kind) {
    case "rate-limit": {
      const resetsAt = formatResetTime(error.retryAt);
      return `GitHub's hourly request limit for this network was reached${
        resetsAt ? `, and resets around ${resetsAt}` : ""
      }.`;
    }
    case "not-found":
      return "No newer release has been published yet.";
    case "malformed":
      return "The latest release did not list the installers we expected.";
    case "server":
      return "GitHub could not serve the release feed right now.";
    default:
      return "The release feed could not be reached.";
  }
};

/** Milliseconds until the quota resets, or 0 when there is nothing to wait for. */
const msUntilRetry = (error: IReleaseError): number => {
  if (error.kind !== "rate-limit" || !error.retryAt) return 0;
  return Math.max(0, error.retryAt * 1000 - Date.now());
};

/**
 * Quiet strip shown when the page is serving pinned links instead of live
 * ones. Deliberately not a blocking error state: every download below still
 * works, so this only explains why the version might not be the newest.
 */
const FallbackNotice = ({
  error,
  tag,
  isRefreshing,
  onRetry,
}: IFallbackNoticeProps) => {
  // Retrying into an exhausted quota just burns the same bucket, so the button
  // stays disabled until GitHub says the window has rolled over. Seeded from a
  // lazy initialiser rather than an effect, which would paint one frame with
  // the button live. Safe to read the clock here: this component only ever
  // renders after a client-side fetch has already failed.
  const [canRetry, setCanRetry] = useState(() => msUntilRetry(error) === 0);

  useEffect(() => {
    const msRemaining = msUntilRetry(error);

    if (msRemaining === 0) {
      setCanRetry(true);
      return;
    }

    setCanRetry(false);
    const timeoutId = setTimeout(() => setCanRetry(true), msRemaining);

    return () => clearTimeout(timeoutId);
  }, [error]);

  return (
    <div
      role="status"
      className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 sm:flex-row sm:items-center"
    >
      <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
      <p className="flex-1">
        {describe(error)} Showing the last known links for{" "}
        <span className="font-semibold">{tag}</span> — a newer version may be
        available.
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={!canRetry || isRefreshing}
        title={canRetry ? undefined : "Available once the limit resets"}
        className={cn(
          "inline-flex w-fit shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-amber-300 px-2 py-1 font-medium transition-colors dark:border-amber-500/40",
          "hover:bg-amber-100 dark:hover:bg-amber-500/20",
          "disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        <RefreshCw
          aria-hidden
          className={cn("size-3", isRefreshing && "animate-spin")}
        />
        {isRefreshing ? "Checking…" : "Try again"}
      </button>
    </div>
  );
};

export default FallbackNotice;
