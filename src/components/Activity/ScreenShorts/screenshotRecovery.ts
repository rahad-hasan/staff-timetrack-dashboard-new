"use client";

import { refreshScreenshotUrls } from "@/actions/screenshots/action";

export type TRecoveryOutcome = "ran" | "waited" | "exhausted";

// When a signed screenshot URL expires, every visible <ScreenshotImage>
// errors at nearly the same moment. All of them funnel through this
// single-flight pass so the tag revalidation + router refresh happens exactly
// once per failure episode instead of once per image.
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

// Called on every successful screenshot load; re-arms recovery so the pass
// budget only starves when refreshes demonstrably stop helping.
export function noteScreenshotLoaded() {
  passesWithoutSuccess = 0;
}

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
      await refreshScreenshotUrls();
    } catch {
      // Revalidation failing (offline, server hiccup) is not fatal — the
      // refresh below still repaints with whatever the server can produce.
    }
    try {
      refresh();
    } catch {
      // router.refresh throwing must not strand callers on the spinner.
    }
    await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));
    return "ran";
  })().finally(() => {
    inflight = null;
    lastFinishedAt = Date.now();
  });

  return inflight;
}
