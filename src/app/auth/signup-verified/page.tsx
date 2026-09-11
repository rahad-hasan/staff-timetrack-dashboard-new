import type { Metadata } from "next";
import SignupVerifiedClient from "@/components/auth/SignupVerifiedClient";

export const metadata: Metadata = {
  title: "Email verified",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function SignupVerifiedPage() {
  return <SignupVerifiedClient />;
}
