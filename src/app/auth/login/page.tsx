import LoginClientComponent from "@/components/auth/LoginClientComponent";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClientComponent />
    </Suspense>
  );
}
