import type { Metadata } from "next";
import SubscriptionVerifiedClient from "@/components/Billing/SubscriptionVerifiedClient";

export const metadata: Metadata = {
  title: "Subscription ready",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function SubscriptionVerifiedPage() {
  return <SubscriptionVerifiedClient />;
}
