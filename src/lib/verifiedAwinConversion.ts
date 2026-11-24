import type { IAwinConversion } from "../types/billing";
import { MARKETING_CONSENT_COOKIE, parseConsent } from "./awinClick";

/**
 * Awin's client-side conversion: the Conversion Tag (`AWIN.Tracking.Sale`,
 * declared BEFORE the MasterTag loads) plus the Fall-back Conversion Pixel
 * (`sread.img`), per Awin's Direct client-side integration docs.
 *
 * Runs only on the bare `/billing/subscription-verified` document — the same
 * isolated page the Google Ads conversion uses — because Awin's own rule is
 * that the MasterTag must not run on pages that display or process payment or
 * personal data, and every other dashboard page does. The page is entered and
 * left by full navigations, so the tag never lingers into the app.
 *
 * Every value comes from the API (`awin_conversion` on the confirm response),
 * re-validated here; the server-to-server order carries the same orderRef,
 * which is how Awin merges the two. Consent: a known answer is passed on
 * (`AdvertiserConsent`, `cons`); an unknown one sends no signal, and Awin then
 * applies its documented default.
 */

const SAFE_PATH = "/billing/subscription-verified";
const TRANSITION_KEY = "stt:awin-transition:v1";
const HANDLED_PREFIX = "stt:awin-conversion:";
const MAX_AGE_MS = 120_000;
const SCRIPT_TIMEOUT_MS = 4000;
/** After the MasterTag executes, time for it to send the sale request. */
const SCRIPT_GRACE_MS = 1200;
const PIXEL_TIMEOUT_MS = 4000;

type AwinSale = Record<string, string>;

declare global {
  interface Window {
    AWIN?: {
      Tracking?: {
        Sale?: AwinSale;
        AdvertiserConsent?: boolean;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    __sttAwinAttempts?: Map<string, Promise<boolean>>;
    __sttAwinHandled?: Set<string>;
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

/** Copies only the expected fields, each in its exact expected shape. */
export function readAwinConversion(value: unknown): IAwinConversion | null {
  const p = record(value);
  if (!p) return null;
  const valid =
    typeof p.advertiser_id === "number" &&
    Number.isSafeInteger(p.advertiser_id) &&
    p.advertiser_id > 0 &&
    typeof p.order_ref === "string" &&
    /^STT-[0-9A-F]{32}$/.test(p.order_ref) &&
    typeof p.amount === "string" &&
    /^\d{1,9}(\.\d{2})?$/.test(p.amount) &&
    Number(p.amount) > 0 &&
    typeof p.currency === "string" &&
    /^[A-Z]{3}$/.test(p.currency) &&
    typeof p.commission_group === "string" &&
    /^[A-Z0-9_.-]{1,64}$/.test(p.commission_group) &&
    (p.customer_acquisition === "NEW" || p.customer_acquisition === "RETURNING") &&
    typeof p.voucher === "string" &&
    p.voucher.length <= 100 &&
    typeof p.channel === "string" &&
    /^[a-z]{1,16}$/.test(p.channel) &&
    typeof p.test === "boolean";
  if (!valid) return null;
  return {
    advertiser_id: p.advertiser_id as number,
    order_ref: p.order_ref as string,
    amount: p.amount as string,
    currency: p.currency as string,
    commission_group: p.commission_group as string,
    customer_acquisition: p.customer_acquisition as "NEW" | "RETURNING",
    voucher: p.voucher as string,
    channel: p.channel as string,
    test: p.test as boolean,
  };
}

/** Only a confirm that activated the purchase may hand one over. */
export function verifiedAwinConversion(response: unknown): IAwinConversion | null {
  const envelope = record(response);
  const data = record(envelope?.data);
  if (envelope?.success !== true || data?.activated !== true) return null;
  return readAwinConversion(data.awin_conversion);
}

export function wasAwinConversionHandled(orderRef: string): boolean {
  if (typeof window === "undefined") return false;
  if (window.__sttAwinHandled?.has(orderRef)) return true;
  try {
    return window.sessionStorage.getItem(`${HANDLED_PREFIX}${orderRef}`) === "handled";
  } catch {
    return false;
  }
}

function markAwinConversionHandled(orderRef: string): void {
  (window.__sttAwinHandled ??= new Set<string>()).add(orderRef);
  try {
    window.sessionStorage.setItem(`${HANDLED_PREFIX}${orderRef}`, "handled");
  } catch {
    /* In-memory de-duplication still applies. */
  }
}

/** Same-tab, short-lived hand-off from the success page. No account or Stripe data. */
export function storeVerifiedAwinTransition(response: unknown): boolean {
  if (typeof window === "undefined") return false;
  const payload = verifiedAwinConversion(response);
  if (!payload || wasAwinConversionHandled(payload.order_ref)) return false;
  try {
    const serialized = JSON.stringify({ ...payload, createdAt: Date.now() });
    window.sessionStorage.setItem(TRANSITION_KEY, serialized);
    return window.sessionStorage.getItem(TRANSITION_KEY) === serialized;
  } catch {
    return false;
  }
}

export function readVerifiedAwinTransition(): IAwinConversion | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = JSON.parse(window.sessionStorage.getItem(TRANSITION_KEY) || "null");
    const payload = readAwinConversion(raw ? { ...raw, createdAt: undefined } : null);
    const createdAt: unknown = raw?.createdAt;
    const now = Date.now();
    if (
      payload &&
      typeof createdAt === "number" &&
      Number.isFinite(createdAt) &&
      createdAt <= now &&
      now - createdAt <= MAX_AGE_MS
    ) {
      return payload;
    }
  } catch {
    /* Fall through: unreadable is the same as absent. */
  }
  clearVerifiedAwinTransition();
  return null;
}

export function clearVerifiedAwinTransition(): void {
  try {
    window.sessionStorage.removeItem(TRANSITION_KEY);
  } catch {
    /* optional */
  }
}

/**
 * The bare conversion document only — and, as the Google Ads tag requires,
 * one whose referrer carries no query or hash: third-party code can read
 * `document.referrer`, and the success page's URL holds a Stripe id.
 */
function isCleanDocument(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    window.location.pathname === SAFE_PATH &&
    !window.location.search &&
    !window.location.hash &&
    !/[?#]/.test(document.referrer ?? "")
  );
}

function readConsent(): boolean | null {
  try {
    const entry = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${MARKETING_CONSENT_COOKIE}=`));
    return entry ? parseConsent(decodeURIComponent(entry.split("=").slice(1).join("="))) : null;
  } catch {
    return null;
  }
}

/** Loads the MasterTag, which processes AWIN.Tracking.Sale on execution. */
function loadMasterTag(advertiserId: number): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    let script: HTMLScriptElement | undefined;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (script) {
        script.onload = null;
        script.onerror = null;
      }
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), SCRIPT_TIMEOUT_MS);
    try {
      script = document.createElement("script");
      script.id = "stt-awin-mastertag";
      script.defer = true;
      script.referrerPolicy = "no-referrer";
      // Loaded: the load deadline no longer applies, only the grace period.
      script.onload = () => {
        clearTimeout(timer);
        setTimeout(() => finish(true), SCRIPT_GRACE_MS);
      };
      script.onerror = () => finish(false);
      script.src = `https://www.dwin1.com/${advertiserId}.js`;
      document.body.appendChild(script);
    } catch {
      finish(false);
    }
  });
}

/** The Fall-back Conversion Pixel: the sale even when the MasterTag cannot run. */
function firePixel(p: IAwinConversion, consent: boolean | null): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), PIXEL_TIMEOUT_MS);
    try {
      const params = new URLSearchParams({
        tt: "ns",
        tv: "2",
        merchant: String(p.advertiser_id),
        amount: p.amount,
        ch: p.channel,
        parts: `${p.commission_group}:${p.amount}`,
        ref: p.order_ref,
        cr: p.currency,
        // Awin: return `vc` even when empty.
        vc: p.voucher,
        testmode: p.test ? "1" : "0",
        customeracquisition: p.customer_acquisition,
      });
      if (consent !== null) params.set("cons", consent ? "1" : "0");
      const image = new Image(1, 1);
      image.referrerPolicy = "no-referrer";
      image.onload = () => finish(true);
      image.onerror = () => finish(false);
      image.src = `https://www.awin1.com/sread.img?${params.toString()}`;
    } catch {
      finish(false);
    }
  });
}

async function performConversion(p: IAwinConversion): Promise<boolean> {
  try {
    const consent = readConsent();
    // Never re-initialise AWIN / AWIN.Tracking: other properties
    // (AdvertiserConsent) must survive (Conversion Tag docs).
    const awin = (window.AWIN = window.AWIN || {});
    const tracking = (awin.Tracking = awin.Tracking || {});
    if (consent !== null) tracking.AdvertiserConsent = consent;
    tracking.Sale = {
      amount: p.amount,
      channel: p.channel,
      orderRef: p.order_ref,
      parts: `${p.commission_group}:${p.amount}`,
      currency: p.currency,
      voucher: p.voucher,
      test: p.test ? "1" : "0",
      customerAcquisition: p.customer_acquisition,
    };
    const [tag, pixel] = await Promise.all([loadMasterTag(p.advertiser_id), firePixel(p, consent)]);
    return tag || pixel;
  } catch {
    return false;
  }
}

/**
 * Fires once per orderRef per tab. Resolves true when the tag or the pixel
 * went out (a request sent is not proof Awin attributed it), false when both
 * were blocked or timed out — the transition then stays retriable for its TTL.
 */
export async function sendVerifiedAwinConversion(value: unknown): Promise<boolean> {
  if (!isCleanDocument()) return false;
  const payload = readAwinConversion(value);
  if (!payload) return false;
  if (wasAwinConversionHandled(payload.order_ref)) return true;

  const attempts = (window.__sttAwinAttempts ??= new Map<string, Promise<boolean>>());
  const current = attempts.get(payload.order_ref);
  if (current) return current;

  const attempt = performConversion(payload).then((sent) => {
    if (sent) markAwinConversionHandled(payload.order_ref);
    return sent;
  });
  attempts.set(payload.order_ref, attempt);
  try {
    return await attempt;
  } finally {
    attempts.delete(payload.order_ref);
  }
}
