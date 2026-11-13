import { liveJson } from "@/lib/server/liveJson";

export const dynamic = "force-dynamic";

/**
 * `GET /api/onboarding-status` → the viewer's onboarding state
 * (`GET /user/onboarding-status`). Read by `onboardingStore.fetchStatus`:
 * OnboardingGate's own try when the layout's read of it failed.
 *
 * A route handler rather than the `getOnboardingStatus` server action. That
 * try runs while the page hydrates, and only in a render whose reads were
 * failing — so next to live views that have just thrown into their error
 * boundaries. An action settling then sent Next's router into React #310 at
 * the first recovery refresh (or a click on "Try again"), replacing the whole
 * app with the error screen although the API had come back (see liveJson).
 * Answers 401 when the session is gone.
 */
export async function GET() {
  return liveJson("/user/onboarding-status");
}
