const TRANSITION_KEY = "stt:verified-trial-transition:v1";
const MAX_AGE_MS = 120_000;
type Transition = { id: string; email: string; createdAt: number };

function validContext(value: unknown, now: number): value is Transition {
  if (!value || typeof value !== "object") return false;
  const context = value as Partial<Transition>;
  return typeof context.id === "string" && /^stt_otp_[a-f0-9]{64}$/.test(context.id)
    && typeof context.email === "string" && context.email.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(context.email)
    && typeof context.createdAt === "number" && Number.isFinite(context.createdAt)
    && context.createdAt <= now && now - context.createdAt <= MAX_AGE_MS;
}

/** Functional onboarding context, same-tab only, short-lived, never analytics.
 * Contains no OTP, password or token. The API still authorizes company creation.
 */
export function storeVerifiedTrialTransition(id: unknown, email: unknown): boolean {
  if (typeof window === "undefined") return false;
  const context = { id, email, createdAt: Date.now() };
  if (!validContext(context, Date.now())) return false;
  try {
    const serialized = JSON.stringify(context);
    window.sessionStorage.setItem(TRANSITION_KEY, serialized);
    return window.sessionStorage.getItem(TRANSITION_KEY) === serialized;
  } catch { return false; }
}

export function readVerifiedTrialTransition(): Transition | null {
  if (typeof window === "undefined") return null;
  try {
    const context = JSON.parse(window.sessionStorage.getItem(TRANSITION_KEY) || "null");
    if (validContext(context, Date.now())) return context;
    clearVerifiedTrialTransition();
  } catch { /* Fail closed without preventing ordinary signup. */ }
  return null;
}

export function clearVerifiedTrialTransition(): void {
  try { window.sessionStorage.removeItem(TRANSITION_KEY); } catch { /* optional */ }
}
