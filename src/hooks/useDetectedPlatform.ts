"use client";

import { useEffect, useState } from "react";

import {
  UNKNOWN_PLATFORM,
  detectPlatformAsync,
  detectPlatformSync,
} from "@/utils/detectPlatform";
import type { IDetectedPlatform } from "@/types/releases";

export interface IUseDetectedPlatformResult {
  platform: IDetectedPlatform;
  /** False until detection has finished and the result will not change again. */
  isResolved: boolean;
}

/**
 * Detects the visitor's OS and, on macOS, which build to recommend.
 *
 * Detection deliberately starts in `useEffect` rather than in a lazy
 * `useState` initialiser: `navigator` does not exist during the server render,
 * so reading it while rendering would make the client's first paint disagree
 * with the server HTML and trip a hydration error.
 *
 * Windows and Linux resolve from the synchronous pass alone. macOS waits for
 * the async `userAgentData` pass before reporting itself resolved — announcing
 * the sync result first would paint the "pick your Mac build" card and then
 * swap it for a single button a frame later.
 */
export const useDetectedPlatform = (): IUseDetectedPlatformResult => {
  const [platform, setPlatform] = useState<IDetectedPlatform>(UNKNOWN_PLATFORM);
  const [isResolved, setIsResolved] = useState(false);

  useEffect(() => {
    let isActive = true;

    const initial = detectPlatformSync();

    if (initial.os !== "mac") {
      setPlatform(initial);
      setIsResolved(true);
      return;
    }

    void detectPlatformAsync(initial).then((refined) => {
      if (!isActive) return;
      setPlatform(refined);
      setIsResolved(true);
    });

    return () => {
      isActive = false;
    };
  }, []);

  return { platform, isResolved };
};
