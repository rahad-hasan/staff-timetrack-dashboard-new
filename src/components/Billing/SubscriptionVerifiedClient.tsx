"use client";

import { useEffect, useRef } from "react";
import { sendVerifiedSubscriptionConversion } from "@/lib/verifiedSubscriptionGoogleAds";
import { clearVerifiedSubscriptionTransition, readVerifiedSubscriptionTransition } from "@/lib/verifiedSubscriptionTransition";

export default function SubscriptionVerifiedClient() {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const context = readVerifiedSubscriptionTransition();
    if (!context) {
      window.location.replace("/billing/success");
      return;
    }

    // This clean document contains no customer or checkout-session details.
    // A full navigation unloads Google code before returning to billing UI.
    void sendVerifiedSubscriptionConversion(context).then((handled) => {
      // Failure remains retriable on a clean-page revisit within the same TTL.
      if (handled) clearVerifiedSubscriptionTransition();
    }).finally(() => {
      // No session_id: the success page reads status without confirming again.
      window.location.replace("/billing/success");
    });
  }, []);

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-white dark:bg-darkPrimaryBg px-6">
      <div role="status" className="text-center space-y-3">
        <h1 className="text-2xl font-semibold">Subscription ready</h1>
        <p>You&apos;ll continue automatically.</p>
      </div>
    </main>
  );
}
