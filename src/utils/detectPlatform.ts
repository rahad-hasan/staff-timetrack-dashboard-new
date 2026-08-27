import type { IDetectedPlatform, TDownloadTargetId } from "@/types/releases";

/**
 * Best-effort OS + CPU architecture detection for the download page.
 *
 * The hard case is macOS. Safari and Firefox still report `MacIntel` /
 * "Intel Mac OS X" on Apple Silicon, so a user-agent regex misfiles every
 * M-series Mac as Intel — and there is no second signal worth trusting:
 * Safari masks the WebGL unmasked renderer to a constant "Apple GPU" on Intel
 * Macs too, so sniffing it would confidently mislabel the very machines it is
 * meant to rescue. Getting this wrong is not cosmetic: an `arm64` .dmg will
 * not open at all on an Intel Mac.
 *
 * So only `userAgentData.getHighEntropyValues` (Chromium) resolves the Mac
 * architecture. Everywhere else this leaves `recommendedTarget` null and the
 * UI asks the user to choose rather than guessing for them.
 */

/** Shape of the Chromium-only `navigator.userAgentData` we actually use. */
interface INavigatorUAData {
  platform?: string;
  mobile?: boolean;
  getHighEntropyValues?: (hints: string[]) => Promise<{
    architecture?: string;
    bitness?: string;
  }>;
}

export const UNKNOWN_PLATFORM: IDetectedPlatform = {
  os: "unknown",
  recommendedTarget: null,
};

const getUAData = (): INavigatorUAData | undefined =>
  (navigator as Navigator & { userAgentData?: INavigatorUAData }).userAgentData;

/**
 * Synchronous first pass. Settles Windows and Linux outright; for macOS it
 * settles only the OS, leaving the architecture to {@link detectPlatformAsync}.
 */
export const detectPlatformSync = (): IDetectedPlatform => {
  if (typeof navigator === "undefined") return UNKNOWN_PLATFORM;

  const ua = navigator.userAgent ?? "";
  // Deprecated, but still the only way to catch iPadOS in desktop mode.
  const plat = navigator.platform ?? "";
  const uaData = getUAData();
  const uaPlatform = uaData?.platform ?? "";

  // Exclusions first — every one of these would otherwise be swallowed by a
  // desktop branch below, and none of them can run a desktop installer.
  if (uaData?.mobile === true) return UNKNOWN_PLATFORM;
  if (/iPhone|iPod|iPad/i.test(ua)) return UNKNOWN_PLATFORM;
  // iPadOS in "Request Desktop Website" mode claims to be a Mac.
  if (/^Mac/i.test(plat) && navigator.maxTouchPoints > 1) {
    return UNKNOWN_PLATFORM;
  }
  // Android's UA contains "Linux", so it must be tested first.
  if (/Android/i.test(ua) || uaPlatform === "Android") return UNKNOWN_PLATFORM;
  // ChromeOS also reads as Linux but cannot run the Linux installer: the
  // download lands outside the Crostini container, which is off on most
  // managed devices anyway.
  if (/CrOS/.test(ua) || uaPlatform === "Chrome OS") return UNKNOWN_PLATFORM;

  if (uaPlatform === "Windows" || /Win/i.test(plat) || /Windows NT/i.test(ua)) {
    // Windows on ARM emulates x64 installers, so the single .exe is the right
    // answer for every Windows machine and needs no architecture split.
    return { os: "windows", recommendedTarget: "win" };
  }

  if (uaPlatform === "macOS" || /^Mac/i.test(plat) || /Macintosh/.test(ua)) {
    return { os: "mac", recommendedTarget: null };
  }

  if (uaPlatform === "Linux" || /Linux|X11/i.test(ua) || /Linux/i.test(plat)) {
    // The only Linux artefact is x86_64; there is no arm64 build to route to.
    return { os: "linux", recommendedTarget: "linux" };
  }

  return UNKNOWN_PLATFORM;
};

/**
 * Second pass, Chromium only: `getHighEntropyValues` reports the real CPU
 * architecture, which is the one trustworthy way to tell an Apple Silicon Mac
 * from an Intel one. Safari and Firefox do not implement it, and it is absent
 * on non-secure origins — both cases keep the "ask the user" result.
 *
 * Takes the first pass as an argument so a caller that already ran it does not
 * pay for the regexes twice.
 */
export const detectPlatformAsync = async (
  base: IDetectedPlatform = detectPlatformSync(),
): Promise<IDetectedPlatform> => {
  if (base.os !== "mac") return base;

  const uaData = getUAData();
  if (typeof uaData?.getHighEntropyValues !== "function") return base;

  try {
    // "platform" is not a legal hint; the legal set is architecture, bitness,
    // formFactors, fullVersionList, model, platformVersion, uaFullVersion, wow64.
    const hints = await uaData.getHighEntropyValues(["architecture", "bitness"]);

    let target: TDownloadTargetId | null = null;
    if (hints?.architecture === "arm") target = "macArm";
    else if (hints?.architecture === "x86") target = "macX64";

    if (!target) return base;

    return { os: "mac", recommendedTarget: target };
  } catch {
    // The promise rejects with NotAllowedError in some embedding contexts.
    return base;
  }
};
