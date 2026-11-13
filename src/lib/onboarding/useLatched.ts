"use client";

import { useState } from "react";

/**
 * True from the first render in which `value` is true, and forever after.
 *
 * The mount gate for lazily loaded overlays. Rendering one only while it is
 * open would unmount it the instant it closes, which skips its exit animation
 * and Radix's focus return. Latched, its chunk is still fetched the first time
 * it is needed, but it then stays mounted and closes like any other overlay.
 */
export function useLatched(value: boolean): boolean {
  const [latched, setLatched] = useState(value);
  // Adjusting own state during render: React re-renders straight away,
  // before committing, so the overlay mounts in the same commit it opens.
  if (value && !latched) setLatched(true);
  return latched || value;
}
