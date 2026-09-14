"use client";

import { useEffect, useRef } from "react";
import { buildCreateOrganizationUrl } from "@/lib/marketingPlanIntent";
import { sendVerifiedTrialConversion } from "@/lib/verifiedTrialGoogleAds";
import {
  clearVerifiedTrialTransition,
  readVerifiedTrialTransition,
  verifiedTrialPlanIntent,
} from "@/lib/verifiedTrialTransition";

/**
 * A detour, not a destination.
 *
 * The Google Ads conversion may only fire on a document with no query string,
 * no hash and no param-bearing referrer (`isSafeDocument` in
 * `@/lib/verifiedTrialGoogleAds`), so the OTP screen bounces through this bare
 * URL instead of tagging the email-bearing one. Everything the next screen
 * needs therefore travels in the sessionStorage transition record rather than
 * on this page's own URL — do not add params here to "fix" anything, because
 * the conversion would then stop firing with no error of any kind.
 *
 * The one obligation of this hop is to put the visitor back exactly where the
 * OTP screen would have sent them. It failed that obligation once: it rebuilt
 * the URL from the email alone, which dropped the verified name and any plan
 * intent for every signup that reached it. `buildCreateOrganizationUrl` is now
 * the single builder both routes share.
 */
export default function SignupVerifiedClient() {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const context = readVerifiedTrialTransition();
    if (!context) {
      window.location.replace("/auth/login");
      return;
    }

    // Resolved before the send begins, so nothing the tracking code does — or
    // fails to do — can change where the visitor lands.
    const next = buildCreateOrganizationUrl(
      context.email,
      context.name,
      verifiedTrialPlanIntent(context),
    );

    // No email in this document's URL or DOM. A full document transition after
    // the bounded send prevents the Google tag following authenticated app use.
    void sendVerifiedTrialConversion(context.id).then((handled) => {
      // Failed attempts remain eligible for a clean-page revisit during the
      // original short TTL. Never retry tracking on the email-bearing page.
      if (handled) clearVerifiedTrialTransition();
    }).finally(() => {
      // `finally`, so a blocked tag, a timeout or a thrown send can never turn
      // a successful verification into an abandoned signup.
      window.location.replace(next);
    });
  }, []);

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-darkPrimaryBg px-6">
      <div role="status" className="text-center space-y-3">
        <h1 className="text-2xl font-semibold">Email verified</h1>
        <p>Preparing your free trial. You&apos;ll continue automatically.</p>
      </div>
    </main>
  );
}
