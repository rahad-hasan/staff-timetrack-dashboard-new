/**
 * The desktop-release feed contract, shared by the server route that reads
 * GitHub (`app/api/releases/route.ts`) and the browser hook that renders it
 * (`hooks/useReleases.ts`).
 *
 * No "use client" / "server-only": both sides run these rules. The route
 * applies them to GitHub's payload, and the hook applies them again to the
 * route's answer — every URL that reaches an `href` passes
 * `isTrustedReleaseUrl` in the browser that renders it, whatever served it.
 */

import type {
  IReleaseAsset,
  IReleaseError,
  IReleaseInfo,
  TDownloadTargetId,
  TReleaseAssets,
  TReleaseErrorKind,
} from "@/types/releases";

export const RELEASE_REPO = "staff-time-tracker/desktop-app-releases";

export const RELEASES_PAGE_URL = `https://github.com/${RELEASE_REPO}/releases`;

/** Same-origin route that serves the latest release (see its module comment). */
export const RELEASE_FEED_PATH = "/api/releases";

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
export const ASSET_PATTERNS: Record<TDownloadTargetId, RegExp> = {
  win: /^StaffTimeTracker-Setup-.*\.exe$/i,
  macArm: /-arm64\.dmg$/i,
  macX64: /-x64\.dmg$/i,
  linux: /^StaffTimeTracker-.*\.sh$/i,
};

export const TARGET_IDS = Object.keys(ASSET_PATTERNS) as TDownloadTargetId[];

const BYTES_PER_MB = 1024 * 1024;

export const formatMb = (bytes: number): string =>
  `${(bytes / BYTES_PER_MB).toFixed(1)} MB`;

export const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const TRUSTED_HOST = "github.com";

/**
 * Every URL this page puts in an `href` must lead back into our own release
 * repo on github.com. The feed is the only thing between a visitor and an
 * installer, so a value that points anywhere else — another host, another
 * repo on github.com, plain `http:`, or a `javascript:` URL — is dropped
 * rather than rendered.
 *
 * The check runs on the WHATWG-parsed URL, so `..` segments (raw or
 * `%2e`-encoded) are already resolved and cannot climb out of the prefix, and
 * `user@host` / `host:port` tricks fail the exact host and port comparison.
 * The repo segment is compared case-insensitively because GitHub routes
 * owner/repo case-insensitively; the tag and filename after it are untouched.
 */
export const isTrustedReleaseUrl = (
  value: string,
  section: "download" | "tag",
): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  return (
    parsed.protocol === "https:" &&
    parsed.hostname === TRUSTED_HOST &&
    parsed.port === "" &&
    parsed.username === "" &&
    parsed.password === "" &&
    parsed.pathname
      .toLowerCase()
      .startsWith(`/${RELEASE_REPO}/releases/${section}/`.toLowerCase())
  );
};

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
 * Pinned copy of v1.0.4 so the page still works when the feed is rate-limited
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

export const buildReleaseError = (
  kind: TReleaseErrorKind,
  status: number | null = null,
  retryAt: number | null = null,
): IReleaseError => ({ kind, status, retryAt });

/** The route's JSON body: a release on 200, an error on anything else. */
export type TReleaseFeedBody =
  | { release: IReleaseInfo }
  | { error: IReleaseError };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

/**
 * Re-checks one asset of an already-parsed release. A slot that fails any
 * rule is dropped exactly like a missing asset: its card reads "not
 * available", and if every slot is dropped the caller serves the pinned
 * release instead.
 */
const sanitizeAsset = (
  value: unknown,
  target: TDownloadTargetId,
): IReleaseAsset | null => {
  if (!isRecord(value)) return null;
  const { name, url, sizeLabel } = value;
  if (!isNonEmptyString(name) || !ASSET_PATTERNS[target].test(name)) {
    return null;
  }
  if (!isNonEmptyString(url) || !isTrustedReleaseUrl(url, "download")) {
    return null;
  }
  return {
    name,
    url,
    sizeLabel: typeof sizeLabel === "string" ? sizeLabel : "",
  };
};

/**
 * Validates the release the feed route answered with before any of it is
 * rendered. Same allowlist as the route's GitHub parsing, applied again here
 * because the browser is where the links become clickable.
 */
export const sanitizeReleaseInfo = (value: unknown): IReleaseInfo | null => {
  if (!isRecord(value) || !isNonEmptyString(value.tag)) return null;
  if (!isRecord(value.assets)) return null;

  const rawAssets = value.assets;
  const assets = TARGET_IDS.reduce((accumulator, target) => {
    accumulator[target] = sanitizeAsset(rawAssets[target], target);
    return accumulator;
  }, {} as TReleaseAssets);

  if (!TARGET_IDS.some((target) => assets[target] !== null)) return null;

  return {
    tag: value.tag,
    releaseUrl:
      isNonEmptyString(value.releaseUrl) &&
      isTrustedReleaseUrl(value.releaseUrl, "tag")
        ? value.releaseUrl
        : `${RELEASES_PAGE_URL}/tag/${encodeURIComponent(value.tag)}`,
    publishedAt: isNonEmptyString(value.publishedAt) ? value.publishedAt : null,
    assets,
  };
};

const ERROR_KINDS: readonly TReleaseErrorKind[] = [
  "rate-limit",
  "not-found",
  "network",
  "server",
  "malformed",
];

const isNullableNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

/** Reads the route's error body; `null` when it is not one (e.g. an HTML 404). */
export const readReleaseError = (body: unknown): IReleaseError | null => {
  if (!isRecord(body) || !isRecord(body.error)) return null;
  const { kind, status, retryAt } = body.error;
  if (!ERROR_KINDS.includes(kind as TReleaseErrorKind)) return null;
  return buildReleaseError(
    kind as TReleaseErrorKind,
    isNullableNumber(status) ? status : null,
    isNullableNumber(retryAt) ? retryAt : null,
  );
};
