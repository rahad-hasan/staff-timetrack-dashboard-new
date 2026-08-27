"use client";

import { useCallback, useState } from "react";

import type { TDownloadTargetId } from "@/types/releases";

import type { IPlatformGroup, TPlatformGroupId } from "./downloadTargets";

type TOverrides = Partial<Record<TPlatformGroupId, TDownloadTargetId>>;

export interface IVariantSelection {
  /** What the user or detection settled on, or `null` if neither has yet. */
  chosenFor: (group: IPlatformGroup) => TDownloadTargetId | null;
  /** Same, but always a build — falls back to the group's leading variant. */
  selectedFor: (group: IPlatformGroup) => TDownloadTargetId;
  select: (group: IPlatformGroup, id: TDownloadTargetId) => void;
}

/**
 * One build selection, shared by the recommended hero and the platform matrix.
 *
 * Lifted out of the card so the two can never disagree: switching the macOS
 * card to Intel also switches the hero's call to action, rather than leaving
 * the page advertising two different builds at once.
 *
 * Stored as an override rather than as the selection itself, because detection
 * lands after the first paint — keeping the resolved value would freeze
 * whatever was known at mount, and syncing it in an effect would clobber a
 * choice the user had already made.
 */
export const useVariantSelection = (
  detectedTarget: TDownloadTargetId | null,
): IVariantSelection => {
  const [overrides, setOverrides] = useState<TOverrides>({});

  const chosenFor = useCallback(
    (group: IPlatformGroup): TDownloadTargetId | null => {
      const override = overrides[group.id];
      if (override) return override;

      const detectedHere = group.variants.some(
        (variant) => variant.id === detectedTarget,
      );

      return detectedHere ? detectedTarget : null;
    },
    [overrides, detectedTarget],
  );

  const selectedFor = useCallback(
    (group: IPlatformGroup): TDownloadTargetId =>
      chosenFor(group) ?? group.variants[0].id,
    [chosenFor],
  );

  const select = useCallback((group: IPlatformGroup, id: TDownloadTargetId) => {
    setOverrides((current) => ({ ...current, [group.id]: id }));
  }, []);

  return { chosenFor, selectedFor, select };
};
