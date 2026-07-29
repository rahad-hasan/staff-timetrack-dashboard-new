import { Suspense } from "react";
import type { Metadata } from "next";
import SuspensionsPageClient from "@/app/(main_layout)/insights/suspensions/_components/SuspensionsPageClient";

export const metadata: Metadata = {
  title: "Suspicious Activity | Tracking Suspensions",
  description:
    "Review tracking suspensions flagged by anomaly detection across your team.",
};

export default function SuspensionsPage() {
  return (
    <Suspense fallback={null}>
      <SuspensionsPageClient />
    </Suspense>
  );
}
