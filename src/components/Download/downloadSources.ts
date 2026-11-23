/**
 * Where each build comes from, and the allowlist each source's links must pass
 * before they can become an `href`.
 *
 * Two sources:
 * - **Microsoft Store** for Windows. The button downloads Microsoft's own
 *   Store installer for our product — the file the official "Get it from
 *   Microsoft" badge serves in its default "direct" mode — so one click saves
 *   an `.exe` instead of detouring through the Store web page. That stub is
 *   signed by Microsoft Corporation (Microsoft Marketplace CA → Microsoft Root
 *   CA 2011) and installs, then keeps updating, the Store build.
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

/**
 * The two Microsoft endpoints this page may link to, each pinned to one host
 * and to our product's exact path.
 * - `installer`: the direct download (`Content-Disposition: attachment`).
 * - `listing`: the public product page, linked as a secondary "see it in the
 *   Store" reference.
 */
const MICROSOFT_STORE_ENDPOINTS = {
  installer: {
    host: "get.microsoft.com",
    path: `/installer/download/${MICROSOFT_STORE_PRODUCT_ID}`,
  },
  listing: {
    host: "apps.microsoft.com",
    path: `/detail/${MICROSOFT_STORE_PRODUCT_ID}`,
  },
} as const;

type TStoreEndpoint = keyof typeof MICROSOFT_STORE_ENDPOINTS;

const buildStoreUrl = (endpoint: TStoreEndpoint): string => {
  const { host, path } = MICROSOFT_STORE_ENDPOINTS[endpoint];
  return `https://${host}${path}`;
};

/** One click → `Staff Time Tracker Installer.exe` (~0.8 MB, Microsoft-signed). */
export const MICROSOFT_STORE_INSTALLER_URL = buildStoreUrl("installer");

/** The filename Microsoft serves the installer under, shown beside the button. */
const MICROSOFT_STORE_INSTALLER_NAME = "Staff Time Tracker Installer.exe";

/**
 * Bare listing URL. The share link's `?ocid=webpdpshare` is left off: it tags
 * traffic as coming from the Store's own Share button, which would misattribute
 * every click from this page. The Store adds the visitor's locale itself.
 */
export const MICROSOFT_STORE_LISTING_URL = buildStoreUrl("listing");

/**
 * A Microsoft Store link is trusted only if it points at OUR product on the
 * one Microsoft host that endpoint lives on: `https:`, the exact hostname (so
 * not a look-alike or a sibling subdomain), no port or `user@` prefix, and the
 * exact product path. Any other app — even on the real host — fails.
 *
 * Runs on the WHATWG-parsed URL, so `..` segments are already resolved and
 * cannot step out of the path. The product id is compared case-insensitively
 * because Microsoft routes it that way; a trailing slash is the only other
 * accepted variant.
 */
export const isTrustedStoreUrl = (
  value: string,
  endpoint: TStoreEndpoint,
): boolean => {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }

  const { host, path } = MICROSOFT_STORE_ENDPOINTS[endpoint];
  const pathname = parsed.pathname.toLowerCase().replace(/\/$/, "");

  return (
    parsed.protocol === "https:" &&
    parsed.hostname === host &&
    parsed.port === "" &&
    parsed.username === "" &&
    parsed.password === "" &&
    pathname === path.toLowerCase()
  );
};

/**
 * The last check before a download link is rendered. A URL must pass the
 * allowlist of the source it claims to be from, so a GitHub URL cannot be
 * presented as the Store installer or the reverse — and the Store listing
 * page, being a web page, never passes as a download.
 */
export const isTrustedDownload = (download: TResolvedDownload): boolean =>
  download.source === "microsoft-store"
    ? isTrustedStoreUrl(download.url, "installer")
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
    download = {
      source: "microsoft-store",
      url: MICROSOFT_STORE_INSTALLER_URL,
      name: MICROSOFT_STORE_INSTALLER_NAME,
    };
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
