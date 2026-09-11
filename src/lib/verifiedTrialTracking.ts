declare global {
  interface Window {
    dataLayer?: unknown[];
    __sttVerifiedTrialIds?: Set<string>;
  }
}

/** Queue only a server-confirmed signup. This does not load trackers, grant
 * consent, or send a network request. A consent-aware tag must consume it.
 */
export function queueVerifiedTrialConversion(id: unknown): boolean {
  if (typeof window === "undefined" || typeof id !== "string" ||
      !/^stt_otp_[a-f0-9]{64}$/.test(id)) return false;

  try {
    const seen = window.__sttVerifiedTrialIds ??= new Set<string>();
    if (seen.has(id)) return false;
    const storageKey = `stt:otp-conversion:${id}`;
    try {
      if (window.sessionStorage.getItem(storageKey) === "queued") return false;
    } catch { /* Storage may be disabled; in-memory deduplication still works. */ }

    const layer = window.dataLayer ??= [];
    if (!Array.isArray(layer)) return false;
    layer.push({
      event: "stt_otp_verified_free_trial",
      transaction_id: id,
      signup_method: "email_otp",
    });
    seen.add(id);
    try { window.sessionStorage.setItem(storageKey, "queued"); } catch { /* optional */ }
    return true;
  } catch {
    return false;
  }
}
