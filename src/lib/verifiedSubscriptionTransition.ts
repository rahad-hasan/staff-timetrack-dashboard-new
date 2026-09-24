import type { ISubscriptionConversion } from "../types/billing";
import {
  readSubscriptionConversion,
  verifiedSubscriptionConversion,
  wasSubscriptionConversionHandled,
} from "./verifiedSubscriptionTracking";

const TRANSITION_KEY = "stt:subscription-transition:v1";
const MAX_AGE_MS = 120_000;
type Transition = ISubscriptionConversion & { createdAt: number };

/** Same-tab, short-lived transition. No email, account or Stripe/session IDs. */
export function storeVerifiedSubscriptionTransition(response: unknown): boolean {
  if (typeof window === "undefined") return false;
  const payload = verifiedSubscriptionConversion(response);
  // Already handled from this tab (a refresh of the success URL replays the
  // confirm and the backend re-sends the payload): nothing left to fire, so
  // the caller must not detour again.
  if (!payload || wasSubscriptionConversionHandled(payload.id)) return false;
  try {
    const serialized = JSON.stringify({ ...payload, createdAt: Date.now() });
    window.sessionStorage.setItem(TRANSITION_KEY, serialized);
    return window.sessionStorage.getItem(TRANSITION_KEY) === serialized;
  } catch { return false; }
}

export function readVerifiedSubscriptionTransition(): Transition | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = JSON.parse(window.sessionStorage.getItem(TRANSITION_KEY) || "null");
    const payload = readSubscriptionConversion(raw);
    const createdAt: unknown = raw?.createdAt;
    const now = Date.now();
    if (payload && typeof createdAt === "number" && Number.isFinite(createdAt) &&
        createdAt <= now && now - createdAt <= MAX_AGE_MS) return { ...payload, createdAt };
    clearVerifiedSubscriptionTransition();
  } catch { clearVerifiedSubscriptionTransition(); }
  return null;
}

export function clearVerifiedSubscriptionTransition(): void {
  try { window.sessionStorage.removeItem(TRANSITION_KEY); } catch { /* optional */ }
}
