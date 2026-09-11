import { queueVerifiedTrialConversion } from "./verifiedTrialTracking";

const ADS_ID = "AW-18353762928";
const ADS_DESTINATION = `${ADS_ID}/J1IICLX9_PEcEPDk4K9E`;
const SAFE_LOCATION = "https://app.stafftimetracker.org/auth/signup-verified";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    __sttOtpAdsConfigured?: boolean;
  }
}

/** Google Ads only, after backend-confirmed OTP signup. No GTM container,
 * automatic page views, enhanced conversions, or new consent banner.
 * Where no existing Google-tag consent integration exists, use denied defaults
 * (advanced/cookieless measurement), never infer consent from OTP verification.
 */
export async function sendVerifiedTrialConversion(id: unknown): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.location.hostname !== "app.stafftimetracker.org" ||
      window.location.pathname !== "/auth/signup-verified" ||
      window.location.search || window.location.hash) return false;
  // OTP metadata sets no-referrer. Fail closed if an unexpected caller brings
  // a query-bearing referrer to this otherwise clean document.
  if (/[?#]/.test(document.referrer)) return false;
  if (!queueVerifiedTrialConversion(id)) return false;

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
    if (!window.__sttOtpAdsConfigured) {
      // This isolated page contains no email. Set explicit safe values as a
      // second layer of protection before loading Google code.
      gtag("set", {
        page_location: SAFE_LOCATION,
        page_referrer: "",
        page_title: "Email verified",
        ads_data_redaction: true,
        allow_ad_personalization_signals: false,
      });
      gtag("js", new Date());
      gtag("config", ADS_ID, {
        send_page_view: false,
        page_location: SAFE_LOCATION,
        page_referrer: "",
        page_title: "Email verified",
        allow_enhanced_conversions: false,
        allow_ad_personalization_signals: false,
      });
      window.__sttOtpAdsConfigured = true;

      if (!document.getElementById("stt-otp-google-ads")) {
        const script = document.createElement("script");
        script.id = "stt-otp-google-ads";
        script.async = true;
        script.referrerPolicy = "no-referrer";
        script.src = `https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`;
        document.head.appendChild(script);
      }
    }

    // Bounded wait only after successful verification. A blocker, offline
    // connection or Google error must never prevent company creation.
    return await new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => resolve(false), 1200);
      gtag("event", "conversion", {
        send_to: ADS_DESTINATION,
        transaction_id: id,
        value: 0,
        currency: "GBP",
        page_location: SAFE_LOCATION,
        page_referrer: "",
        page_title: "Email verified",
        allow_enhanced_conversions: false,
        event_timeout: 1000,
        event_callback: () => {
          clearTimeout(timer);
          // A tag callback is not proof of attribution or receipt by Google.
          resolve(true);
        },
      });
    });
  } catch {
    return false;
  }
}
