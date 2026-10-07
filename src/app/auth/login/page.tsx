import type { Metadata } from "next";
import LoginClientComponent from "@/components/auth/LoginClientComponent";
import { Suspense } from "react";

// The root layout marks every route noindex; the login page is the one
// public entry point we want search engines to list.
export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClientComponent />
    </Suspense>
  );
}
