import OnboardingBackdrop from "@/components/auth/CreateOrganization/OnboardingBackdrop";
import ResetPasswordClient from "@/components/auth/ResetPasswordClient";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingBackdrop/>
      <ResetPasswordClient />
    </Suspense>
  );
}
