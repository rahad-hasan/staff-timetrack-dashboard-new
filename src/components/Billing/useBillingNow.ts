"use client";

import { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/**
 * The "now" a billing countdown renders with.
 *
 * While the server renders the page, and while the browser hydrates that
 * HTML, it is `serverNow`: the server's own stamp taken when it read the
 * billing status. Both passes then compute the same day count and choose the
 * same "ends" or "ended" wording. Every render after hydration, and any
 * component first mounted in the browser, uses the browser's clock.
 *
 * Reading the clock in both passes made them disagree whenever they fell on
 * either side of a whole-day step or of the trial's end itself (or the
 * browser's clock was off), and React then discarded the server HTML.
 */
export function useBillingNow(serverNow?: number): number {
  // False on the server and during hydration, true for every render after.
  const hydrated = useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
  return hydrated || typeof serverNow !== "number" ? Date.now() : serverNow;
}
