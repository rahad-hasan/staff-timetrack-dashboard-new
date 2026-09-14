"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { CreateOrganizationDialog } from "./index";
import OnboardingBackdrop from "./OnboardingBackdrop";
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
 *
 * A signup that started from the marketing pricing page also carries
 * `?plan=&cycle=&trial=` here. This component never reads it, but it must not
 * strip it either: `useEnterPlanSelection` re-reads the live URL when `POST
 * /company` succeeds and that is where the plan/trial fork happens. Any future
 * rewrite of this URL has to preserve those params or the visitor gets asked to
 * pick a plan they already picked.
 */
const CreateOrganizationPageClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  // Purely a nicety — it only seeds the name suggestions on step 1. The dialog
  // has a second entry point (the login page, for accounts that verified but
  // never finished) that has no name to pass, so this must never gate the
  // render the way a missing `email` does.
  const userName = searchParams.get("name");
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
    // `relative` so the backdrop's own `fixed` layer can sit behind this
    // content via its negative z-index without escaping the stacking context.
    <div className="relative min-h-screen w-full">
      <OnboardingBackdrop />

      {/* No logo header: the backdrop now carries the product framing (its own
          sidebar wordmark is right there), and a crisp logo floating over a
          blurred dashboard read as a rendering fault rather than branding. The
          design places nothing above the dialog either. */}

      <CreateOrganizationDialog
        open
        email={email}
        userName={userName ?? undefined}
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
