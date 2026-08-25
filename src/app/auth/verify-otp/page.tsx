import SignupVerifyOtpClient from "@/components/auth/SignupVerifyOtpClient";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Enter the verification code we sent to your email",
};

/**
 * Where the marketing site drops a fresh signup: `POST /auth/create-account`
 * has already emailed the code, and the browser arrives at
 * `/auth/verify-otp?email=…` to enter it.
 */
export default function SignupVerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <SignupVerifyOtpClient />
    </Suspense>
  );
}
