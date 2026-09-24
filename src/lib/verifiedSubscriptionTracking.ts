import type { ISubscriptionConversion } from "../types/billing";

declare global {
  interface Window {
    dataLayer?: unknown[];
    __sttSubscriptionIds?: Set<string>;
    __sttSubscriptionHandledIds?: Set<string>;
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

/** Copy only the opaque ID and authoritative amount/currency, never API extras. */
export function readSubscriptionConversion(value: unknown): ISubscriptionConversion | null {
  const payload = record(value);
  if (!payload || typeof payload.id !== "string" || !/^stt_subscribe_[a-f0-9]{64}$/.test(payload.id) ||
      typeof payload.value !== "number" || !Number.isFinite(payload.value) || payload.value <= 0 ||
      (payload.currency !== "USD" && payload.currency !== "GBP" && payload.currency !== "EUR")) return null;
  return { id: payload.id, value: payload.value, currency: payload.currency };
}

/** Only checkout-confirm may supply this payload. The backend enforces live
 * mode, paid ownership and replay guards before returning it. An active/free
 * billing-status response alone is never a conversion.
 */
export function verifiedSubscriptionConversion(response: unknown): ISubscriptionConversion | null {
  const envelope = record(response);
  const data = record(envelope?.data);
  if (envelope?.success !== true || data?.activated !== true ||
      data.checkout_status !== "complete" || data.payment_status !== "paid" ||
      data.subscription_status !== "active") return null;
  return readSubscriptionConversion(data.subscription_conversion);
}

/** A tag callback means handled, not confirmed receipt or attribution. */
export function wasSubscriptionConversionHandled(id: string): boolean {
  if (typeof window === "undefined") return false;
  if (window.__sttSubscriptionHandledIds?.has(id)) return true;
  try { return window.sessionStorage.getItem(`stt:subscription-conversion:${id}`) === "handled"; }
  catch { return false; }
}

export function markSubscriptionConversionHandled(id: string): void {
  if (typeof window === "undefined" || !/^stt_subscribe_[a-f0-9]{64}$/.test(id)) return;
  (window.__sttSubscriptionHandledIds ??= new Set<string>()).add(id);
  try { window.sessionStorage.setItem(`stt:subscription-conversion:${id}`, "handled"); }
  catch { /* In-memory deduplication still applies. */ }
}

/** Ensure one pending event per document; failed sends remain retriable. */
export function queueSubscriptionConversion(value: unknown): boolean {
  if (typeof window === "undefined") return false;
  const payload = readSubscriptionConversion(value);
  if (!payload) return false;
  try {
    const seen = window.__sttSubscriptionIds ??= new Set<string>();
    if (wasSubscriptionConversionHandled(payload.id)) return false;
    if (seen.has(payload.id)) return true;
    const layer = window.dataLayer ??= [];
    if (!Array.isArray(layer)) return false;
    // Google Ads permits at most 64 characters; keep the full hash only.
    const transactionId = payload.id.slice("stt_subscribe_".length);
    if (!layer.some((item) => {
      const event = record(item);
      return event?.event === "stt_paid_subscription" && event.transaction_id === transactionId;
    })) {
      layer.push({
        event: "stt_paid_subscription",
        transaction_id: transactionId,
        value: payload.value,
        currency: payload.currency,
      });
    }
    seen.add(payload.id);
    try { window.sessionStorage.setItem(`stt:subscription-conversion:${payload.id}`, "pending"); }
    catch { /* optional */ }
    return true;
  } catch { return false; }
}
