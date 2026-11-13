import { NextResponse } from "next/server";

import {
  ASSET_PATTERNS,
  RELEASE_REPO,
  RELEASES_PAGE_URL,
  TARGET_IDS,
  buildReleaseError,
  formatMb,
  isNonEmptyString,
  isTrustedReleaseUrl,
  type TReleaseFeedBody,
} from "@/components/Download/releaseFeed";
import type {
  IReleaseAsset,
  IReleaseError,
  IReleaseInfo,
  TDownloadTargetId,
  TReleaseAssets,
} from "@/types/releases";

export const runtime = "nodejs";
// Per request, never prerendered at build time (that would call GitHub during
// `next build`). The upstream fetch below still goes through the Data Cache:
// an explicit `next.revalidate` on a fetch overrides force-dynamic's no-store.
export const dynamic = "force-dynamic";

/**
 * `GET /api/releases` → the latest desktop release, parsed and allowlisted.
 *
 * The download page used to call api.github.com from every browser. GitHub
 * allows 60 unauthenticated requests an hour per client IP, so a whole office
 * behind one NAT shared one budget and routinely fell back to the pinned
 * release. The release is public and identical for every user — the one kind
 * of data this app caches across users — so the server reads it at most once
 * per REVALIDATE_SECONDS into Next's Data Cache and answers everyone from it.
 *
 * The upstream request carries no Authorization header and no cookies, so its
 * cache entry is keyed by URL and fixed headers only and is shared by every
 * visitor. This route needs no session either: it is outside the middleware
 * matcher and serves nothing private.
 *
 * Once a release has been cached, a failing GitHub is invisible: Next keeps
 * serving the last good entry while it retries in the background. Only a
 * cold cache can surface a failure, and `loadLatestRelease` stops that from
 * fanning out into one GitHub call per visitor.
 */

/**
 * `/releases/latest` excludes drafts and prereleases server-side, but orders by
 * the release's `created_at` (the *commit* date), not `published_at` — so a
 * release cut from an older commit can outrank a newer one. That is exactly
 * what GitHub's own "Latest" badge shows, so the two stay consistent; switch to
 * `/releases` + a `published_at` sort only if that ever diverges.
 */
const LATEST_RELEASE_ENDPOINT = `https://api.github.com/repos/${RELEASE_REPO}/releases/latest`;

const REVALIDATE_SECONDS = 300;

/** Shared caches may keep a good answer as long as the server does. */
const SUCCESS_CACHE_CONTROL = `public, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=600`;

/**
 * Below the browser's own 10s budget (`useReleases`), so a hung GitHub still
 * reaches the visitor as a "network" error and the pinned links, rather than
 * as a client-side timeout.
 */
const UPSTREAM_TIMEOUT_MS = 8_000;

/** How long a cold-cache failure is replayed before GitHub is asked again. */
const FAILURE_BACKOFF_MS = 30_000;

/** Upper bound on waiting out a rate limit, whatever reset time GitHub sent. */
const MAX_RATE_LIMIT_BACKOFF_MS = 60 * 60_000;

/** Only the fields of the GitHub payload this route reads. */
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
  assets?: unknown;
}

type TFeedResult =
  | { ok: true; release: IReleaseInfo }
  | { ok: false; error: IReleaseError };

const isGithubAsset = (value: unknown): value is IGithubReleaseAsset =>
  typeof value === "object" && value !== null;

/**
 * Pulls one asset out of the payload. Every field is treated as untrusted:
 * a release published mid-upload can carry an asset with no URL yet.
 */
const extractAsset = (
  assets: readonly unknown[],
  target: TDownloadTargetId,
): IReleaseAsset | null => {
  const match = assets.find(
    (asset): asset is IGithubReleaseAsset =>
      isGithubAsset(asset) &&
      isNonEmptyString(asset.name) &&
      ASSET_PATTERNS[target].test(asset.name) &&
      // A half-uploaded asset already appears in the payload with a URL that
      // 404s, so skip anything GitHub has not finished storing.
      asset.state !== "open",
  );

  if (!match) return null;

  const name = match.name;
  const url = match.browser_download_url;

  if (!isNonEmptyString(name) || !isNonEmptyString(url)) return null;

  // An off-repo URL makes this slot unusable, exactly like a missing asset:
  // the card falls back to "not available" and, if every slot is dropped,
  // `parseRelease` reports the release as malformed (→ pinned fallback).
  if (!isTrustedReleaseUrl(url, "download")) return null;

  const size = typeof match.size === "number" && match.size > 0 ? match.size : 0;

  return {
    name,
    url,
    // A zero size means GitHub gave us no number; show nothing rather than
    // an authoritative-looking "0.0 MB".
    sizeLabel: size > 0 ? formatMb(size) : "",
  };
};

const parseRelease = (payload: unknown): IReleaseInfo | null => {
  if (typeof payload !== "object" || payload === null) return null;
  const release = payload as IGithubRelease;

  const tag = isNonEmptyString(release.tag_name) ? release.tag_name : null;
  if (!tag) return null;

  // `IGithubRelease` is an assertion over untrusted JSON, not a guarantee.
  if (!Array.isArray(release.assets)) return null;
  const rawAssets: readonly unknown[] = release.assets;

  const assets = TARGET_IDS.reduce((accumulator, target) => {
    accumulator[target] = extractAsset(rawAssets, target);
    return accumulator;
  }, {} as TReleaseAssets);

  // A release with none of our four artefacts is useless to this page; the
  // pinned fallback is strictly better than four dead cards.
  const hasAnyAsset = TARGET_IDS.some((target) => assets[target] !== null);
  if (!hasAnyAsset) return null;

  return {
    tag,
    releaseUrl:
      isNonEmptyString(release.html_url) &&
      isTrustedReleaseUrl(release.html_url, "tag")
        ? release.html_url
        : `${RELEASES_PAGE_URL}/tag/${encodeURIComponent(tag)}`,
    publishedAt: isNonEmptyString(release.published_at)
      ? release.published_at
      : null,
    assets,
  };
};

/** When GitHub says the caller may try again, in Unix seconds. */
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
    return buildReleaseError("rate-limit", status, retryAt);
  }

  if (status === 404) {
    // 404 here means any of: repo removed, repo made private, or no
    // non-draft non-prerelease release published yet.
    return buildReleaseError("not-found", status);
  }

  return buildReleaseError("server", status, retryAt);
};

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException &&
  (error.name === "TimeoutError" || error.name === "AbortError");

const readUpstream = async (): Promise<TFeedResult> => {
  let response: Response;
  try {
    response = await fetch(LATEST_RELEASE_ENDPOINT, {
      headers: {
        Accept: "application/vnd.github+json",
        // Server-side there is no CORS preflight to avoid, so the API version
        // is pinned explicitly (it is the default version anyway).
        "X-GitHub-Api-Version": "2022-11-28",
        // GitHub rejects API requests without a User-Agent.
        "User-Agent": "staff-time-tracker-dashboard",
      },
      // Shared Data Cache entry: safe only because nothing user-specific
      // (Authorization, cookies) is in this request. Only 200s are stored.
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    return { ok: false, error: buildReleaseError("network") };
  }

  if (!response.ok) {
    return { ok: false, error: classifyResponse(response) };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    // The timeout can also fire while the body is still streaming.
    return {
      ok: false,
      error: buildReleaseError(
        isAbortError(error) ? "network" : "malformed",
        isAbortError(error) ? null : response.status,
      ),
    };
  }

  const release = parseRelease(payload);
  return release
    ? { ok: true, release }
    : { ok: false, error: buildReleaseError("malformed", response.status) };
};

/*
 * Per-process guards for the cold-cache path (best effort: each server
 * process keeps its own). Without them, every visitor arriving while GitHub
 * is down or rate-limiting this server's IP would trigger — and wait on — a
 * GitHub call of its own, and concurrent cache misses queue one after another
 * behind Next's per-key cache lock.
 */
let inFlight: Promise<TFeedResult> | null = null;
let failureMemo: { error: IReleaseError; until: number } | null = null;

const backoffUntil = (error: IReleaseError, now: number): number => {
  const floor = now + FAILURE_BACKOFF_MS;
  if (error.kind !== "rate-limit" || !error.retryAt) return floor;
  return Math.max(
    floor,
    Math.min(error.retryAt * 1000, now + MAX_RATE_LIMIT_BACKOFF_MS),
  );
};

const loadLatestRelease = (): Promise<TFeedResult> => {
  const now = Date.now();
  if (failureMemo && now < failureMemo.until) {
    return Promise.resolve({ ok: false, error: failureMemo.error });
  }

  inFlight ??= readUpstream()
    .then((result) => {
      failureMemo = result.ok
        ? null
        : { error: result.error, until: backoffUntil(result.error, Date.now()) };
      return result;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
};

export async function GET() {
  const result = await loadLatestRelease();

  if (result.ok) {
    return NextResponse.json<TReleaseFeedBody>(
      { release: result.release },
      { headers: { "Cache-Control": SUCCESS_CACHE_CONTROL } },
    );
  }

  // A failure must never be stored downstream: the next request should get
  // the release as soon as GitHub can serve it.
  return NextResponse.json<TReleaseFeedBody>(
    { error: result.error },
    { status: 502, headers: { "Cache-Control": "no-store" } },
  );
}
