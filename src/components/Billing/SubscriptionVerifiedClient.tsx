"use client";

import { useEffect, useRef } from "react";
import { sendVerifiedSubscriptionConversion } from "@/lib/verifiedSubscriptionGoogleAds";
import { clearVerifiedSubscriptionTransition, readVerifiedSubscriptionTransition } from "@/lib/verifiedSubscriptionTransition";
import {
  clearVerifiedAwinTransition,
  readVerifiedAwinTransition,
  sendVerifiedAwinConversion,
} from "@/lib/verifiedAwinConversion";

export default function SubscriptionVerifiedClient() {
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const context = readVerifiedSubscriptionTransition();
    const awin = readVerifiedAwinTransition();
    if (!context && !awin) {
      window.location.replace("/billing/success");
      return;
    }

    // This clean document contains no customer or checkout-session details.
    // A full navigation unloads Google and Awin code before returning to the
    // billing UI. Each failure remains retriable on a clean-page revisit
    // within its transition's TTL.
    const sends: Promise<void>[] = [];
    if (context) {
      sends.push(sendVerifiedSubscriptionConversion(context).then((handled) => {
        if (handled) clearVerifiedSubscriptionTransition();
      }));
    }
    if (awin) {
      sends.push(sendVerifiedAwinConversion(awin).then((handled) => {
        if (handled) clearVerifiedAwinTransition();
      }));
    }
    void Promise.allSettled(sends).finally(() => {
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
