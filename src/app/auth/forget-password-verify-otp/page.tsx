import ForgetPasswordVerifyOtpClient from "@/components/auth/ForgetPasswordVerifyOtpClient";
import { Suspense } from "react";

export default function ForgetPasswordVerifyOtpPage() {
  return (
    <Suspense fallback={null}>
      <ForgetPasswordVerifyOtpClient />
    </Suspense>
  );
}
