"use client";

import { refreshScreenshotUrls } from "@/actions/screenshots/action";
import { checkBeforeRefresh } from "@/hooks/useLiveRefresh";

export type TRecoveryOutcome = "ran" | "waited" | "exhausted";

// When a signed screenshot URL expires, every visible <ScreenshotImage>
// errors at nearly the same moment. All of them funnel through this
// single-flight pass so the route re-render happens exactly once per failure
// episode instead of once per image.
let inflight: Promise<TRecoveryOutcome> | null = null;
let lastFinishedAt = 0;
let passesWithoutSuccess = 0;

const RECOVERY_COOLDOWN_MS = 8_000;

// How long to let the refreshed RSC payload land before callers retry; a
// retry that fires before new props arrive would burn an attempt on the same
// expired URL.
const SETTLE_MS = 1_200;

// Recovery passes may re-sign URLs on every pass, so per-image retry budgets
// can't bound the loop on their own. This global cap does: after this many
// consecutive passes with no screenshot loading anywhere, recovery reports
// "exhausted" and callers fall back instead of refreshing the route forever.
const MAX_PASSES_WITHOUT_SUCCESS = 3;

// Called on every successful screenshot load, and when a picture already on
// screen is handed a re-signed URL it does not need to load again (see
// ScreenshotImage); re-arms recovery so the pass budget only starves when
// refreshes demonstrably stop helping.
export function noteScreenshotLoaded() {
  passesWithoutSuccess = 0;
}

// `refresh` (router.refresh) is only the fallback for a pass whose server
// action never completed — see the pass below.
export function recoverScreenshotUrls(
  refresh: () => void,
): Promise<TRecoveryOutcome> {
  if (inflight) return inflight;

  if (passesWithoutSuccess >= MAX_PASSES_WITHOUT_SUCCESS) {
    return Promise.resolve("exhausted");
  }

  // A pass just finished. Hold the caller until the cooldown lapses instead
  // of resolving immediately: the pending payload gets time to land (a new
  // src resets the caller outright) and same-URL remounts stay spaced out
  // rather than burning the caller's retry budget in milliseconds.
  const sinceLast = Date.now() - lastFinishedAt;
  if (sinceLast < RECOVERY_COOLDOWN_MS) {
    return new Promise((resolve) =>
      setTimeout(() => resolve("waited"), RECOVERY_COOLDOWN_MS - sinceLast),
    );
  }

  inflight = (async (): Promise<TRecoveryOutcome> => {
    passesWithoutSuccess += 1;
    try {
      // The action revalidates, so Next answers it with a fresh render of the
      // whole route — and every screenshot read is live, so that render
      // already carries re-signed URLs. When this resolves the router has
      // been handed the new tree; a router.refresh() on top would only render
      // the route a second time for the same URLs.
      await refreshScreenshotUrls();
    } catch {
      // The action never completed (offline, server hiccup, deploy): fall
      // back to a plain refresh so the route still repaints with whatever the
      // server can produce — but never blind. A refresh that cannot land
      // makes Next leave the page for the browser's error page (see
      // checkBeforeRefresh), and these are the very conditions it fails in.
      // Unreachable or another build: skip it; the caller's retry budget and
      // the pass cap above then end on the Reload button instead.
      try {
        if ((await checkBeforeRefresh()) === "refresh") refresh();
      } catch {
        // Neither the check nor router.refresh may strand callers on the spinner.
      }
    }
    await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
    return "ran";
  })().finally(() => {
    inflight = null;
    lastFinishedAt = Date.now();
  });

  return inflight;
}
