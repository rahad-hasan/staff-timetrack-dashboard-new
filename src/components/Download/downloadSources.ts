/**
 * Where each build comes from, and the allowlist each source's links must pass
 * before they can become an `href`.
 *
 * Two sources:
 * - **Microsoft Store** for Windows: one fixed listing, which replaced the
 *   GitHub `.exe` download.
 * - **GitHub release** for macOS and Linux: the live feed from
 *   `/api/releases` (see `releaseFeed.ts`).
 *
 * Same rule as the release feed: every URL is parsed and compared against an
 * exact protocol, host and path before it is rendered, and once more inside
 * `DownloadButton` right where the link is created.
 */

import type {
  TDownloadTargetId,
  TReleaseAssets,
  TResolvedDownload,
  TStoreTargetId,
} from "@/types/releases";

import { isTrustedReleaseUrl } from "./releaseFeed";

/** Staff Time Tracker's product id in Partner Center. */
const MICROSOFT_STORE_PRODUCT_ID = "9NDFHLP3L7LV";

const MICROSOFT_STORE_HOST = "apps.microsoft.com";

const MICROSOFT_STORE_LISTING_PATH = `/detail/${MICROSOFT_STORE_PRODUCT_ID}`;

/**
 * The public listing. Lowercase id, as Microsoft's own share link writes it;
 * the Store resolves either case. The share link's `?ocid=webpdpshare` is
 * left off: it tags traffic as coming from the Store's own Share button, which
 * would misattribute every click from this page. The Store adds the visitor's
 * `hl` / `gl` locale itself on arrival.
 */
const MICROSOFT_STORE_URL = `https://${MICROSOFT_STORE_HOST}${MICROSOFT_STORE_LISTING_PATH.toLowerCase()}`;

/**
 * A Microsoft Store link is trusted only if it opens OUR listing on
 * Microsoft's own host: `https:`, exactly `apps.microsoft.com` (so not a
 * look-alike or a subdomain someone else controls), no port or `user@` prefix,
 * and the exact `/detail/<our product id>` path. Any other app's listing,
 * even on the real host, fails.
 *
 * Runs on the WHATWG-parsed URL, so `..` segments are already resolved and
 * cannot step out of the path. The id is compared case-insensitively because
 * the Store routes it that way. A trailing slash is the only accepted variant.
 */
const isTrustedStoreUrl = (value: string): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  const pathname = parsed.pathname.toLowerCase().replace(/\/$/, "");

  return (
    parsed.protocol === "https:" &&
    parsed.hostname === MICROSOFT_STORE_HOST &&
    parsed.port === "" &&
    parsed.username === "" &&
    parsed.password === "" &&
    pathname === MICROSOFT_STORE_LISTING_PATH.toLowerCase()
  );
};

/**
 * The last check before a link is rendered. A URL must pass the allowlist of
 * the source it claims to be from, so a GitHub URL cannot be presented as the
 * Store listing or the reverse.
 */
export const isTrustedDownload = (download: TResolvedDownload): boolean =>
  download.source === "microsoft-store"
    ? isTrustedStoreUrl(download.url)
    : isTrustedReleaseUrl(download.url, "download");

const isStoreTarget = (id: TDownloadTargetId): id is TStoreTargetId =>
  id === "win";

/**
 * The one link the page may render for a build, or `null` when it has none
 * (its asset is missing from the release, or its URL failed the allowlist).
 * Every surface on the page goes through here rather than reading
 * `release.assets` directly, so the Windows → Store routing lives in one place.
 */
export const resolveDownload = (
  id: TDownloadTargetId,
  assets: TReleaseAssets,
): TResolvedDownload | null => {
  let download: TResolvedDownload;

  if (isStoreTarget(id)) {
    download = { source: "microsoft-store", url: MICROSOFT_STORE_URL };
  } else {
    const asset = assets[id];
    if (!asset) return null;
    download = {
      source: "github-release",
      url: asset.url,
      name: asset.name,
      sizeLabel: asset.sizeLabel,
    };
  }

  return isTrustedDownload(download) ? download : null;
};

/**
 * Hostname shown beside a Store button, so the user sees where the click goes
 * before making it. Read from the URL itself rather than hardcoded, so the
 * label can never disagree with the link.
 */
export const getDownloadHost = (download: TResolvedDownload): string =>
  new URL(download.url).hostname;
