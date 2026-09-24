import type { ISubscriptionConversion } from "../types/billing";
import {
  readSubscriptionConversion,
  markSubscriptionConversionHandled,
  queueSubscriptionConversion,
  wasSubscriptionConversionHandled,
} from "./verifiedSubscriptionTracking";

const ADS_ID = "AW-18353762928";
const ADS_DESTINATION = `${ADS_ID}/6YaHCImxqdccEPDk4K9E`;
const SAFE_LOCATION = "https://app.stafftimetracker.org/billing/subscription-verified";
const LOAD_TIMEOUT_MS = 2500;
const EVENT_TIMEOUT_MS = 1500;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    __sttSubscriptionAdsConfigured?: boolean;
    __sttSubscriptionAdsLoaded?: boolean;
    __sttSubscriptionAdsLoad?: Promise<boolean>;
    __sttSubscriptionAdsAttempts?: Map<string, Promise<boolean>>;
  }
}

function isSafeDocument(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined" &&
    window.location.hostname === "app.stafftimetracker.org" &&
    window.location.pathname === "/billing/subscription-verified" &&
    !window.location.search && !window.location.hash && !/[?#]/.test(document.referrer);
}

function loadAdsScript(): Promise<boolean> {
  return new Promise((resolve) => {
    let script: HTMLScriptElement | undefined;
    let settled = false;
    const finish = (loaded: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (script) {
        script.onload = null;
        script.onerror = null;
        if (!loaded) {
          try { script.remove(); } catch { /* Still release onboarding. */ }
        }
      }
      if (loaded) window.__sttSubscriptionAdsLoaded = true;
      resolve(loaded);
    };
    const timer = setTimeout(() => finish(false), LOAD_TIMEOUT_MS);
    try {
      document.getElementById("stt-subscription-google-ads")?.remove();
      script = document.createElement("script");
      script.id = "stt-subscription-google-ads";
      script.async = true;
      script.referrerPolicy = "no-referrer";
      script.onload = () => finish(true);
      script.onerror = () => finish(false);
      script.src = `https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`;
      document.head.appendChild(script);
    } catch { finish(false); }
  });
}

async function ensureAdsLoaded(): Promise<boolean> {
  if (window.__sttSubscriptionAdsLoaded) return true;
  if (!window.__sttSubscriptionAdsLoad) {
    window.__sttSubscriptionAdsLoad = (async () => {
      // Retry transient failures on this clean document only. Two bounded
      // loads plus the event wait cap onboarding's total delay at 6.5 seconds.
      for (let attempt = 0; attempt < 2; attempt += 1) {
        if (!isSafeDocument()) return false;
        if (await loadAdsScript()) return true;
      }
      return false;
    })();
  }
  const loaded = await window.__sttSubscriptionAdsLoad;
  if (!loaded) window.__sttSubscriptionAdsLoad = undefined;
  return loaded;
}

/** Google Ads only, after backend-confirmed live paid subscription. No GTM container,
 * explicit page-view events, enhanced conversions, or new consent banner.
 * Where no existing Google-tag consent integration exists, use denied defaults
 * (advanced/cookieless measurement), never infer consent from a successful payment.
 */
export async function sendVerifiedSubscriptionConversion(value: unknown): Promise<boolean> {
  // Checkout-success metadata sets no-referrer. Recheck after loading as well, in case the
  // document's location changed while the request was pending.
  if (!isSafeDocument()) return false;
  const payload = readSubscriptionConversion(value);
  if (!payload) return false;
  const { id } = payload;
  if (wasSubscriptionConversionHandled(id)) return true;
  const attempts = window.__sttSubscriptionAdsAttempts ??= new Map<string, Promise<boolean>>();
  const current = attempts.get(id);
  if (current) return current;
  if (!queueSubscriptionConversion(payload)) return false;
  const attempt = performConversion(payload);
  attempts.set(id, attempt);
  try { return await attempt; } finally { attempts.delete(id); }
}

async function performConversion(payload: ISubscriptionConversion): Promise<boolean> {
  const { id } = payload;
  try {
    if (!window.gtag) {
      window.gtag = function () {
        // Preserve Google's documented gtag command-queue Arguments format.
        // eslint-disable-next-line prefer-rest-params
        (window.dataLayer ??= []).push(arguments);
      };
      window.gtag("consent", "default", {
        ad_storage: "denied",
        analytics_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }

    const gtag = window.gtag;
    if (!window.__sttSubscriptionAdsConfigured) {
      // This isolated page contains no email. Set explicit safe values as a
      // second layer of protection before loading Google code.
      gtag("set", {
        page_location: SAFE_LOCATION,
        page_referrer: "",
        page_title: "Subscription ready",
        ads_data_redaction: true,
        allow_ad_personalization_signals: false,
      });
      gtag("js", new Date());
      gtag("config", ADS_ID, {
        send_page_view: false,
        page_location: SAFE_LOCATION,
        page_referrer: "",
        page_title: "Subscription ready",
        allow_enhanced_conversions: false,
        allow_ad_personalization_signals: false,
      });
      window.__sttSubscriptionAdsConfigured = true;
    }

    // A queued gtag function is not a loaded tag. Start the event's time budget
    // only after the loader executes; otherwise slow loads lose the conversion.
    if (!await ensureAdsLoaded() || !isSafeDocument()) return false;
    return await new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(false), EVENT_TIMEOUT_MS);
      try {
        gtag("event", "conversion", {
          send_to: ADS_DESTINATION,
          // Keep all 64 hash characters within Google's transaction-ID limit.
          transaction_id: id.slice("stt_subscribe_".length),
          value: payload.value,
          currency: payload.currency,
          page_location: SAFE_LOCATION,
          page_referrer: "",
          page_title: "Subscription ready",
          allow_enhanced_conversions: false,
          event_timeout: 1200,
          event_callback: () => {
            clearTimeout(timer);
            // A tag callback is not proof of attribution or receipt by Google.
            markSubscriptionConversionHandled(id);
            resolve(true);
          },
        });
      } catch {
        clearTimeout(timer);
        resolve(false);
      }
    });
  } catch {
    return false;
  }
}
