declare global {
  interface Window {
    dataLayer?: unknown[];
    __sttVerifiedTrialIds?: Set<string>;
    __sttVerifiedTrialHandledIds?: Set<string>;
  }
}

export function isVerifiedTrialConversionId(id: unknown): id is string {
  return typeof id === "string" && /^stt_otp_[a-f0-9]{64}$/.test(id);
}

/** Google Ads accepts at most 64 characters. Preserve the full hash while
 * keeping the typed prefix in the application's internal deduplication ID. */
export function verifiedTrialAdsTransactionId(id: string): string {
  return id.slice("stt_otp_".length);
}

/** "Handled" means Google's callback ran, not confirmed receipt/attribution. */
export function wasVerifiedTrialConversionHandled(id: string): boolean {
  if (typeof window === "undefined") return false;
  if (window.__sttVerifiedTrialHandledIds?.has(id)) return true;
  try {
    return window.sessionStorage.getItem(`stt:otp-conversion:${id}`) === "handled";
  } catch { return false; }
}

export function markVerifiedTrialConversionHandled(id: string): void {
  if (typeof window === "undefined" || !isVerifiedTrialConversionId(id)) return;
  (window.__sttVerifiedTrialHandledIds ??= new Set<string>()).add(id);
  try { window.sessionStorage.setItem(`stt:otp-conversion:${id}`, "handled"); } catch { /* optional */ }
}

/** Ensure one pending event per document. Already-pending IDs stay eligible
 * for a send retry; only a handled callback suppresses them across navigation.
 * This does not load trackers, grant consent or send a network request.
 */
export function queueVerifiedTrialConversion(id: unknown): boolean {
  if (typeof window === "undefined" || !isVerifiedTrialConversionId(id)) return false;

  try {
    const seen = window.__sttVerifiedTrialIds ??= new Set<string>();
    if (wasVerifiedTrialConversionHandled(id)) return false;
    if (seen.has(id)) return true;
    const storageKey = `stt:otp-conversion:${id}`;
    const transactionId = verifiedTrialAdsTransactionId(id);
    const layer = window.dataLayer ??= [];
    if (!Array.isArray(layer)) return false;
    if (!layer.some((item) => {
      if (!item || typeof item !== "object") return false;
      const event = item as Record<string, unknown>;
      return event.event === "stt_otp_verified_free_trial" &&
        (event.transaction_id === transactionId || event.transaction_id === id);
    })) {
      layer.push({
        event: "stt_otp_verified_free_trial",
        transaction_id: transactionId,
        signup_method: "email_otp",
      });
    }
    seen.add(id);
    // Older versions wrote "queued" before attempting network work. Neither
    // that legacy marker nor "pending" is evidence that a send was handled.
    try { window.sessionStorage.setItem(storageKey, "pending"); } catch { /* optional */ }
    return true;
  } catch {
    return false;
  }
}
