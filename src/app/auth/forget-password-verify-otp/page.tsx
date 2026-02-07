import ForgetPasswordVerifyOtpClient from "@/components/auth/ForgetPasswordVerifyOtpClient";
import { Suspense } from "react";

export default function ForgetPasswordVerifyOtpPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading…</div>}>
      <ForgetPasswordVerifyOtpClient />
    </Suspense>
  );
}
