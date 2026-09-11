"use client";

import { useEffect, useRef } from "react";
import { sendVerifiedTrialConversion } from "@/lib/verifiedTrialGoogleAds";
import { clearVerifiedTrialTransition, readVerifiedTrialTransition } from "@/lib/verifiedTrialTransition";

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

    // No email in this document's URL or DOM. A full document transition after
    // the bounded send prevents the Google tag following authenticated app use.
    void sendVerifiedTrialConversion(context.id).finally(() => {
      clearVerifiedTrialTransition();
      window.location.replace(`/auth/create-organization?email=${encodeURIComponent(context.email)}`);
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
