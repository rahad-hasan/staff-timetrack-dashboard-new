import type { StaticImageData } from "next/image";

import appleIcon from "@/assets/download/download-apple-remove.png";
import linuxIcon from "@/assets/download/download-linux-remove-bg.png";
import windowsIcon from "@/assets/download/download-windows-remove.png";
import type { TDetectedOs, TDownloadTargetId } from "@/types/releases";

/** One card per OS. Reuses the detected-OS names so the two line up directly. */
export type TPlatformGroupId = Exclude<TDetectedOs, "unknown">;

/** One selectable build inside a group. */
export interface IPlatformVariant {
  id: TDownloadTargetId;
  /** Segmented-control label, e.g. "Apple Silicon". */
  label: string;
  /** Second line under the label, e.g. "M series". */
  hint: string;
}

export interface IPlatformGroup {
  id: TPlatformGroupId;
  /** Small eyebrow above the card title, e.g. "macOS". */
  osLabel: string;
  /** Card title, e.g. "macOS app". */
  title: string;
  description: string;
  /** File-type chip used until a real asset name is known, e.g. ".dmg". */
  fileType: string;
  icon: StaticImageData;
  /** `dark:invert` for the black Apple glyph, which vanishes on dark cards. */
  iconClassName?: string;
  alt: string;
  /** More than one entry renders an architecture toggle. */
  variants: IPlatformVariant[];
  /** Shown when the group has variants but none has been chosen yet. */
  choiceHint?: string;
}

/**
 * Every build, keyed by id. Declaring them here rather than inline in the
 * groups makes this a `Record` over `TDownloadTargetId`, so a new target is a
 * compile error until it is described — and it makes `getVariant` a total
 * lookup instead of a search that has to invent a fallback.
 */
export const VARIANTS: Record<TDownloadTargetId, IPlatformVariant> = {
  win: { id: "win", label: "64-bit", hint: "x64" },
  macArm: { id: "macArm", label: "Apple Silicon", hint: "M series" },
  macX64: { id: "macX64", label: "Intel", hint: "2020 & earlier" },
  linux: { id: "linux", label: "x86_64", hint: "Debian, Ubuntu, Fedora" },
};

/**
 * Keyed rather than listed so TypeScript enforces that every group exists — a
 * missing one would otherwise surface as an `undefined` lookup at render time.
 */
export const PLATFORM_GROUPS: Record<TPlatformGroupId, IPlatformGroup> = {
  windows: {
    id: "windows",
    osLabel: "Windows",
    title: "Windows app",
    description: "Full-featured desktop app for Windows 10 and 11.",
    fileType: ".exe",
    icon: windowsIcon,
    alt: "Windows logo",
    variants: [VARIANTS.win],
  },
  mac: {
    id: "mac",
    osLabel: "macOS",
    title: "macOS app",
    description: "Native build for Apple Silicon and Intel Macs.",
    fileType: ".dmg",
    icon: appleIcon,
    iconClassName: "dark:invert",
    alt: "Apple logo",
    variants: [VARIANTS.macArm, VARIANTS.macX64],
    choiceHint:
      "Your browser does not report which chip this Mac uses. Pick the build that matches it — an Apple Silicon installer will not open on an Intel Mac.",
  },
  linux: {
    id: "linux",
    osLabel: "Linux",
    title: "Linux app",
    description: "Self-extracting installer for any x86_64 distro.",
    fileType: ".sh",
    icon: linuxIcon,
    alt: "Linux penguin logo",
    variants: [VARIANTS.linux],
  },
};

/** Render order of the platform matrix. */
export const GROUP_ORDER: TPlatformGroupId[] = ["windows", "mac", "linux"];

/**
 * Which card owns each artefact. Kept explicit rather than derived from
 * `PLATFORM_GROUPS`: as a `Record` over `TDownloadTargetId` it makes an
 * unhomed target a compile error, where a derived index would only fail as an
 * `undefined` lookup mid-render.
 */
const GROUP_OF_TARGET: Record<TDownloadTargetId, TPlatformGroupId> = {
  win: "windows",
  macArm: "mac",
  macX64: "mac",
  linux: "linux",
};

export const getGroupOfTarget = (id: TDownloadTargetId): IPlatformGroup =>
  PLATFORM_GROUPS[GROUP_OF_TARGET[id]];

export const getVariant = (id: TDownloadTargetId): IPlatformVariant =>
  VARIANTS[id];

/**
 * One-line label for the recommended banner: "Windows", or
 * "macOS · Apple Silicon" where the architecture actually distinguishes builds.
 */
export const getTargetLabel = (id: TDownloadTargetId): string => {
  const group = getGroupOfTarget(id);
  if (group.variants.length < 2) return group.osLabel;
  return `${group.osLabel} · ${VARIANTS[id].label}`;
};

/**
 * Extension of the actual downloaded file, so the chip never claims `.dmg`
 * for an asset that is really something else. Falls back to the group's
 * declared type when no asset resolved.
 */
export const getFileType = (
  group: IPlatformGroup,
  assetName: string | undefined,
): string => {
  const match = assetName?.match(/(\.[A-Za-z0-9]+)$/);
  return match ? match[1] : group.fileType;
};
