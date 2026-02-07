import LoginClientComponent from "@/components/auth/LoginClientComponent";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <LoginClientComponent />
    </Suspense>
  );
}
