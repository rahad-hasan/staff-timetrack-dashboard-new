import type { Metadata } from "next";
import ForgotPasswordClient from "@/components/auth/ForgotPasswordClient";
import OnboardingBackdrop from "@/components/auth/CreateOrganization/OnboardingBackdrop";

// The root layout marks every route noindex; forgot-password is a public
// entry point we want search engines to list alongside the login page.
export const metadata: Metadata = {
  robots: { index: true, follow: true },
};

export default function ForgotPasswordPage() {
  return(
  <div className="w-full">
    <OnboardingBackdrop />
    <ForgotPasswordClient />
  </div>
  );
}
