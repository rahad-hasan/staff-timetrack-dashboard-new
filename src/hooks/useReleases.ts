"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  IReleaseAsset,
  IReleaseError,
  IReleaseInfo,
  TDownloadTargetId,
  TReleaseAssets,
  TReleaseErrorKind,
  TReleaseState,
} from "@/types/releases";

const REPO = "staff-time-tracker/desktop-app-releases";

/**
 * `/releases/latest` excludes drafts and prereleases server-side, but orders by
 * the release's `created_at` (the *commit* date), not `published_at` — so a
 * release cut from an older commit can outrank a newer one. That is exactly
 * what GitHub's own "Latest" badge shows, so the two stay consistent; switch to
 * `/releases` + a client-side `published_at` sort only if that ever diverges.
 */
const LATEST_RELEASE_ENDPOINT = `https://api.github.com/repos/${REPO}/releases/latest`;

const RELEASES_PAGE_URL = `https://github.com/${REPO}/releases`;

/**
 * Filename patterns for the four artefacts the page offers. electron-builder
 * uploads `.blockmap`, `.zip`, `.deb`, `.rpm` and `latest*.yml` auto-updater
 * files to the same release, so every pattern is anchored at `$` to keep those
 * out — a `.dmg.blockmap` matching the macOS slot would hand users a 110 KB
 * stub. Case-insensitive because the release mixes `StaffTimeTracker-*` and
 * `staff-time-tracker*` casing across platforms.
 *
 * Linux is the versioned `.sh` self-extracting installer, not the raw
 * `.AppImage`. The name prefix is load-bearing: the release also carries a
 * bare `install.sh`, which is only the ~16 KB bootstrap header.
 */
const PATTERNS: Record<TDownloadTargetId, RegExp> = {
  win: /^StaffTimeTracker-Setup-.*\.exe$/i,
  macArm: /-arm64\.dmg$/i,
  macX64: /-x64\.dmg$/i,
  linux: /^StaffTimeTracker-.*\.sh$/i,
};

const TARGET_IDS = Object.keys(PATTERNS) as TDownloadTargetId[];

const BYTES_PER_MB = 1024 * 1024;

/** Ceiling on one request; `fetch` has no built-in timeout. */
const REQUEST_TIMEOUT_MS = 10_000;

const formatMb = (bytes: number): string =>
  `${(bytes / BYTES_PER_MB).toFixed(1)} MB`;

const buildFallbackAsset = (
  version: string,
  name: string,
  size: number,
): IReleaseAsset => ({
  name,
  url: `${RELEASES_PAGE_URL}/download/v${version}/${name}`,
  sizeLabel: formatMb(size),
});

/**
 * Pinned copy of v1.0.4 so the page still works when the API is rate-limited
 * or unreachable. These URLs are permanent: GitHub keeps release assets at
 * `/releases/download/<tag>/<name>` for the life of the tag.
 */
const FALLBACK_VERSION = "1.0.4";

export const FALLBACK_RELEASE: IReleaseInfo = {
  tag: `v${FALLBACK_VERSION}`,
  releaseUrl: `${RELEASES_PAGE_URL}/tag/v${FALLBACK_VERSION}`,
  publishedAt: null,
  assets: {
    win: buildFallbackAsset(
      FALLBACK_VERSION,
      `StaffTimeTracker-Setup-${FALLBACK_VERSION}.exe`,
      83_966_083,
    ),
    macArm: buildFallbackAsset(
      FALLBACK_VERSION,
      `StaffTimeTracker-${FALLBACK_VERSION}-arm64.dmg`,
      104_743_620,
    ),
    macX64: buildFallbackAsset(
      FALLBACK_VERSION,
      `StaffTimeTracker-${FALLBACK_VERSION}-x64.dmg`,
      113_357_533,
    ),
    linux: buildFallbackAsset(
      FALLBACK_VERSION,
      `StaffTimeTracker-${FALLBACK_VERSION}.sh`,
      116_342_284,
    ),
  },
};

/** Only the fields of the GitHub payload this hook reads. */
interface IGithubReleaseAsset {
  name?: unknown;
  browser_download_url?: unknown;
  size?: unknown;
  /** `"open"` while an upload is still in flight; only `"uploaded"` is usable. */
  state?: unknown;
}

interface IGithubRelease {
  tag_name?: unknown;
  html_url?: unknown;
  published_at?: unknown;
  assets?: IGithubReleaseAsset[];
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Pulls one asset out of the payload. Every field is treated as untrusted:
 * a release published mid-upload can carry an asset with no URL yet.
 */
const extractAsset = (
  release: IGithubRelease,
  target: TDownloadTargetId,
): IReleaseAsset | null => {
  const match = release.assets?.find(
    (asset) =>
      isNonEmptyString(asset?.name) &&
      PATTERNS[target].test(asset.name) &&
      // A half-uploaded asset already appears in the payload with a URL that
      // 404s, so skip anything GitHub has not finished storing.
      asset.state !== "open",
  );

  if (!match) return null;

  const name = match.name;
  const url = match.browser_download_url;

  if (!isNonEmptyString(name) || !isNonEmptyString(url)) return null;

  const size = typeof match.size === "number" && match.size > 0 ? match.size : 0;

  return {
    name,
    url,
    // A zero size means GitHub gave us no number; show nothing rather than
    // an authoritative-looking "0.0 MB".
    sizeLabel: size > 0 ? formatMb(size) : "",
  };
};

const parseRelease = (release: IGithubRelease): IReleaseInfo | null => {
  const tag = isNonEmptyString(release?.tag_name) ? release.tag_name : null;
  if (!tag) return null;

  // `IGithubRelease` is an assertion over untrusted JSON, not a guarantee.
  if (!Array.isArray(release.assets)) return null;

  const assets = TARGET_IDS.reduce((accumulator, target) => {
    accumulator[target] = extractAsset(release, target);
    return accumulator;
  }, {} as TReleaseAssets);

  // A release with none of our four artefacts is useless to this page; the
  // pinned fallback is strictly better than four dead cards.
  const hasAnyAsset = TARGET_IDS.some((target) => assets[target] !== null);
  if (!hasAnyAsset) return null;

  return {
    tag,
    releaseUrl: isNonEmptyString(release.html_url)
      ? release.html_url
      : `${RELEASES_PAGE_URL}/tag/${tag}`,
    publishedAt: isNonEmptyString(release.published_at)
      ? release.published_at
      : null,
    assets,
  };
};

const buildError = (
  kind: TReleaseErrorKind,
  status: number | null = null,
  retryAt: number | null = null,
): IReleaseError => ({ kind, status, retryAt });

/**
 * When the caller may try again. GitHub exposes `X-RateLimit-*` and
 * `Retry-After` through `Access-Control-Expose-Headers`, so both are readable
 * on a cross-origin response.
 */
const readRetryAt = (response: Response): number | null => {
  const reset = Number(response.headers.get("x-ratelimit-reset"));
  if (Number.isFinite(reset) && reset > 0) return reset;

  // Secondary rate limits carry Retry-After (delta-seconds) instead.
  const retryAfter = Number(response.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.floor(Date.now() / 1000) + retryAfter;
  }

  return null;
};

/**
 * Maps a failed response onto an error kind. A 403 on an unauthenticated public
 * read is effectively always the hourly quota, so it is folded in with 429
 * rather than checked against `x-ratelimit-remaining` — a proxy that strips the
 * header would otherwise turn a rate limit into a bare "server error".
 */
const classifyResponse = (response: Response): IReleaseError => {
  const { status } = response;
  const retryAt = readRetryAt(response);

  if (status === 403 || status === 429) {
    return buildError("rate-limit", status, retryAt);
  }

  if (status === 404) {
    // 404 here means any of: repo removed, repo made private, or no
    // non-draft non-prerelease release published yet.
    return buildError("not-found", status);
  }

  return buildError("server", status, retryAt);
};

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
 * Loads the latest desktop release from the public GitHub API.
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
        const response = await fetch(LATEST_RELEASE_ENDPOINT, {
          signal: controller.signal,
          // `Accept` is CORS-safelisted, so this stays a simple request with
          // no preflight round trip. `X-GitHub-Api-Version` is deliberately
          // omitted for that reason — the default version serves every field
          // this hook reads, all of them long-stable.
          headers: { Accept: "application/vnd.github+json" },
          // GitHub answers with `Access-Control-Allow-Origin: *` and no
          // `Allow-Credentials`, so a credentialed request would fail CORS.
          credentials: "omit",
          // No `cache: "no-store"`: GitHub sends `max-age=60`, and letting the
          // browser honour it keeps repeat visits off the 60/hour budget.
        });

        if (!response.ok) {
          failWithFallback(classifyResponse(response));
          return;
        }

        const payload = (await response.json()) as IGithubRelease;
        const parsed = parseRelease(payload);

        if (!parsed) {
          failWithFallback(buildError("malformed", response.status));
          return;
        }

        commit({ status: "success", data: parsed, error: null });
      } catch {
        // An abort is either an unmount/retry — a deliberate teardown, whose
        // writes `commit` already drops — or the timeout above, which is a
        // real network failure and the only one worth reporting.
        if (controller.signal.aborted && !timedOut) return;

        failWithFallback(buildError("network"));
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
