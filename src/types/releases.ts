/**
 * Types for the desktop-app download page, which is fed by the public GitHub
 * Releases API of `staff-time-tracker/desktop-app-releases`.
 */

/** The four artefacts the download page is allowed to hand a user. */
export type TDownloadTargetId = "win" | "macArm" | "macX64" | "linux";

/** OS families we can act on. Everything else (mobile, ChromeOS) is "unknown". */
export type TDetectedOs = "windows" | "mac" | "linux" | "unknown";

export interface IDetectedPlatform {
  os: TDetectedOs;
  /**
   * The single target to highlight, or `null` when we know the OS but not
   * which build (an Apple Silicon .dmg simply refuses to open on Intel, so a
   * wrong guess is worse than no guess).
   */
  recommendedTarget: TDownloadTargetId | null;
}

/** One release asset, already parsed down to what the UI renders. */
export interface IReleaseAsset {
  /** Asset filename, e.g. `StaffTimeTracker-Setup-1.0.4.exe`. */
  name: string;
  /** Direct `browser_download_url` from GitHub. */
  url: string;
  /** Pre-formatted for display, e.g. `80.1 MB`; empty when GitHub gave no size. */
  sizeLabel: string;
}

/** Every target resolved for one release; `null` where the asset is missing. */
export type TReleaseAssets = Record<TDownloadTargetId, IReleaseAsset | null>;

export interface IReleaseInfo {
  /** Raw tag as published, e.g. `v1.0.4`. */
  tag: string;
  /** GitHub release page — the "What's New" destination. */
  releaseUrl: string;
  /** ISO-8601 publish timestamp, or `null` for the offline fallback. */
  publishedAt: string | null;
  assets: TReleaseAssets;
}

/** Why the live fetch failed — drives the wording of the fallback banner. */
export type TReleaseErrorKind =
  | "rate-limit"
  | "not-found"
  | "network"
  | "server"
  | "malformed";

export interface IReleaseError {
  /** Drives the banner copy; the wording itself lives in FallbackNotice. */
  kind: TReleaseErrorKind;
  /** HTTP status when the request completed, otherwise `null`. */
  status: number | null;
  /** Unix seconds when an exhausted rate limit resets, when GitHub tells us. */
  retryAt: number | null;
}

/**
 * Discriminated union rather than a bag of nullable fields, so the UI can
 * never render "loading" and an error at the same time.
 *
 * Note `error` carries `data` too: on failure the hook falls back to a
 * pinned release so the page stays downloadable instead of dead-ending.
 */
export type TReleaseState =
  | { status: "idle"; data: null; error: null }
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: IReleaseInfo; error: null }
  | { status: "error"; data: IReleaseInfo; error: IReleaseError };
