import CreateOrganizationPageClient from "@/components/auth/CreateOrganization/CreateOrganizationPageClient";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Create your organization",
  description: "Set up your workspace to finish creating your account",
};

/**
 * `/auth/create-organization?email=…` — the route form of the
 * `{ redirect: "/create-organization" }` marker the API returns after a
 * sign-up OTP is verified (and again from sign-in for accounts that verified
 * but never finished).
 */
export default function CreateOrganizationPage() {
  return (
    <Suspense fallback={null}>
      <CreateOrganizationPageClient />
    </Suspense>
  );
}
