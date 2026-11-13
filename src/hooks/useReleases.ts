"use client";

import { useCallback, useEffect, useState } from "react";

import {
  FALLBACK_RELEASE,
  RELEASE_FEED_PATH,
  buildReleaseError,
  readReleaseError,
  sanitizeReleaseInfo,
} from "@/components/Download/releaseFeed";
import type {
  IReleaseError,
  IReleaseInfo,
  TReleaseState,
} from "@/types/releases";

/** Ceiling on one request; `fetch` has no built-in timeout. */
const REQUEST_TIMEOUT_MS = 10_000;

const INITIAL_STATE: TReleaseState = { status: "idle", data: null, error: null };

export interface IUseReleasesResult {
  state: TReleaseState;
  /** Always renderable: live data when we have it, the pinned release otherwise. */
  release: IReleaseInfo;
  /** First load only — drives the skeleton. */
  isLoading: boolean;
  /** A retry is in flight while the current result stays on screen. */
  isRefreshing: boolean;
  refetch: () => void;
}

/**
 * Loads the latest desktop release from our own `/api/releases` route, which
 * reads GitHub server-side and caches it for every visitor (see the route for
 * why the browser no longer calls api.github.com itself).
 *
 * Never leaves the page without download links: on any failure it reports the
 * error *and* serves {@link FALLBACK_RELEASE}, so the UI can show a quiet
 * banner rather than an error state the user cannot act on. A retry keeps the
 * links that are already on screen for the same reason — only the very first
 * load has nothing to show.
 */
export const useReleases = (): IUseReleasesResult => {
  const [state, setState] = useState<TReleaseState>(INITIAL_STATE);
  const [attempt, setAttempt] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    // Guards every write, so neither an unmount nor a superseded retry can
    // land on state that has moved on.
    let cancelled = false;

    // Distinguishes the two reasons this request can be aborted: the timeout
    // below (report it) versus an unmount or retry (stay silent).
    let timedOut = false;

    // Belt-and-braces: a hung connection would otherwise pin the skeleton on
    // screen forever, since fetch has no built-in timeout.
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

    const isRetry = attempt > 0;

    const commit = (next: TReleaseState) => {
      if (cancelled) return;
      setState(next);
    };

    const failWithFallback = (error: IReleaseError) => {
      commit({ status: "error", data: FALLBACK_RELEASE, error });
    };

    const load = async () => {
      if (isRetry) {
        // Leave the current release on screen — replacing working download
        // links with a skeleton is a worse answer than a stale version number.
        if (!cancelled) setIsRefreshing(true);
      } else {
        commit({ status: "loading", data: null, error: null });
      }

      try {
        // Same-origin and public: the route reads no cookie, but default
        // credentials are kept so an edge proxy's own cookies (bot checks)
        // still ride along.
        const response = await fetch(RELEASE_FEED_PATH, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        let body: unknown = null;
        try {
          body = await response.json();
        } catch (error) {
          // An abort mid-body is the timeout or a teardown — let the outer
          // handler sort it out. Anything else is a body that is not JSON
          // (e.g. an HTML error page from a proxy).
          if (controller.signal.aborted) throw error;
        }

        if (!response.ok) {
          failWithFallback(
            readReleaseError(body) ?? buildReleaseError("server", response.status),
          );
          return;
        }

        // The route already allowlisted every URL; this re-check is what
        // guarantees it in the browser that turns them into links.
        const release = sanitizeReleaseInfo(
          typeof body === "object" && body !== null && "release" in body
            ? body.release
            : null,
        );

        if (!release) {
          failWithFallback(buildReleaseError("malformed", response.status));
          return;
        }

        commit({ status: "success", data: release, error: null });
      } catch {
        // An abort is either an unmount/retry — a deliberate teardown, whose
        // writes `commit` already drops — or the timeout above, which is a
        // real network failure and the only one worth reporting.
        if (controller.signal.aborted && !timedOut) return;

        failWithFallback(buildReleaseError("network"));
      } finally {
        // The request has settled one way or another; without this the timer
        // lives on for the full budget and aborts a controller nobody is
        // listening to any more.
        clearTimeout(timeoutId);
        if (!cancelled) setIsRefreshing(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [attempt]);

  // Bumping `attempt` re-runs the effect; React tears the previous one down
  // first, so its cleanup aborts any request still in flight.
  const refetch = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  return {
    state,
    release: state.data ?? FALLBACK_RELEASE,
    isLoading: state.status === "idle" || state.status === "loading",
    isRefreshing,
    refetch,
  };
};
