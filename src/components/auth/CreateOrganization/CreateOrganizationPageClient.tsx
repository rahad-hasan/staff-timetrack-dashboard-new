"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import logoWithSlogan from "../../../assets/logo-with-text.webp";
import logoForDark from "../../../assets/logo-with-text-dark.png";
import { CreateOrganizationDialog } from "./index";
import { useEnterPlanSelection } from "./useEnterPlanSelection";

/**
 * Step two of the marketing-site signup: the email was just verified on
 * `/auth/verify-otp`, which hands the browser here as
 * `/auth/create-organization?email=…`. There is still no session — `POST
 * /company` is the call that creates one — so this page is public and the
 * email in the URL is only a claim the backend re-checks against its verified
 * pending-user list.
 *
 * The wizard itself is the same dialog the login page opens for accounts that
 * verified but never finished; here it sits over a bare branded backdrop and
 * completion continues to the plan picker instead of straight to the
 * dashboard.
 */
const CreateOrganizationPageClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const enterPlanSelection = useEnterPlanSelection();

  useEffect(() => {
    if (!email) {
      toast.error("We lost track of your sign-up email — please sign in.", {
        style: {
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
        },
      });
      router.replace("/auth/login");
    }
  }, [email, router]);

  if (!email) return null;

  return (
    <div className="min-h-screen w-full bg-linear-to-b from-[#12cd6918] from-5% to-bgSecondary dark:to-darkSecondaryBg to-20%">
      <div className="w-full flex items-center justify-center">
        <div className="flex items-center gap-1.5 px-8 py-5">
          <Image
            src={logoWithSlogan}
            alt="Logo"
            width={120}
            height={60}
            className="hidden dark:block"
          />
          <Image
            src={logoForDark}
            alt="Logo"
            width={120}
            height={60}
            className="dark:hidden"
          />
        </div>
      </div>

      <CreateOrganizationDialog
        open
        email={email}
        onOpenChange={(next) => {
          // "Back to sign in" / Escape — there is no session to return to, so
          // leaving the wizard means leaving onboarding.
          if (!next) router.push("/auth/login");
        }}
        onCompleted={enterPlanSelection}
      />
    </div>
  );
};

export default CreateOrganizationPageClient;
