import OnboardingBackdrop from "@/components/auth/CreateOrganization/OnboardingBackdrop";
import ForgetPasswordVerifyOtpClient from "@/components/auth/ForgetPasswordVerifyOtpClient";
import { Suspense } from "react";

export default function ForgetPasswordVerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingBackdrop />
      <ForgetPasswordVerifyOtpClient />
    </Suspense>
  );
}
