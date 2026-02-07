import ResetPasswordClient from "@/components/auth/ResetPasswordClient";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center">
          Loading…
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
