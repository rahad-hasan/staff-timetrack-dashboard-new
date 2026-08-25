export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Crown } from "lucide-react";

import { getBillingStatus, getPlans } from "@/actions/billing/action";
import { canMutateSubscription, daysUntil } from "@/lib/billing";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import OnboardingPlanSelection from "@/components/Billing/OnboardingPlanSelection";
import logoWithSlogan from "@/assets/logo-with-text.webp";
import logoForDark from "@/assets/logo-with-text-dark.png";

export const metadata: Metadata = {
  title: "Choose your plan",
  description: "Pick the plan that fits your team — or decide later",
};

/**
 * The last onboarding step, straight after `POST /company`. The create
 * transaction already started the reverse trial (the company sits on the
 * top-tier trial plan with full access), so this screen only SUGGESTS a plan:
 * "Pick a plan later" is a first-class exit that changes nothing — there is no
 * "start trial" call to make.
 *
 * Lives outside `(main_layout)` on purpose: no sidebar, no BillingGate, no
 * billing store — the same standalone pattern as `/billing/success`. Checkout
 * from here uses the shared dialog and returns through `/billing/success`.
 *
 * Only the company admin can buy, and a company that already holds a paid
 * Stripe subscription has nothing to pick — both cases continue to the
 * dashboard instead of rendering a dead grid.
 */
const ChoosePlanPage = async () => {
  const currentUser = await getDecodedUser();

  if ((currentUser?.role ?? "") !== "admin") {
    redirect("/dashboard");
  }

  const [statusRes, plansRes] = await Promise.all([
    getBillingStatus(),
    getPlans(),
  ]);

  const plans = plansRes?.data ?? [];
  const entitlements = statusRes?.data?.entitlements ?? null;

  if (canMutateSubscription(entitlements, plans)) {
    redirect("/dashboard");
  }

  // Billable head count comes from billing/status itself — for a company this
  // young it is the admin alone, which is also the checkout seat floor.
  const activeUserCount = statusRes?.data?.active_user_count ?? 1;

  const trialDaysLeft =
    entitlements?.status === "trialing" && entitlements.trial_ends_at
      ? daysUntil(entitlements.trial_ends_at)
      : null;

  return (
    <div className="min-h-screen w-full bg-linear-to-b from-[#12cd6918] from-5% to-bgSecondary dark:to-darkSecondaryBg to-20%">
      <header className="flex items-center justify-between px-6 py-5 sm:px-8">
        <div className="flex items-center gap-1.5">
          <Image
            src={logoWithSlogan}
            alt="Logo"
            width={120}
            height={35}
            className="hidden dark:block"
          />
          <Image
            src={logoForDark}
            alt="Logo"
            width={120}
            height={35}
            className="dark:hidden"
          />
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm font-medium text-subTextColor hover:text-headingTextColor dark:text-darkTextSecondary dark:hover:text-darkTextPrimary"
        >
          Skip for now
          <ArrowRight className="h-4 w-4" />
        </Link>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h1 className="text-3xl font-semibold text-headingTextColor dark:text-darkTextPrimary sm:text-4xl">
            Choose the plan that&apos;s right for your team
          </h1>
          <p className="mt-3 text-subTextColor dark:text-darkTextSecondary">
            Per-seat pricing that scales with your team. Switch or cancel
            anytime.
          </p>

          {trialDaysLeft !== null && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
              <Crown className="h-4 w-4 shrink-0" />
              <span>
                Your free trial
                {entitlements?.plan_name ? (
                  <>
                    {" "}
                    of <span className="font-medium">{entitlements.plan_name}</span>
                  </>
                ) : null}{" "}
                is already active — {trialDaysLeft}{" "}
                {trialDaysLeft === 1 ? "day" : "days"} left.
              </span>
            </div>
          )}
        </div>

        <OnboardingPlanSelection
          plans={plans}
          entitlements={entitlements}
          activeUserCount={activeUserCount}
          isAdmin
        />

        <div className="mt-12 text-center">
          <p className="mb-3 text-sm text-subTextColor dark:text-darkTextSecondary">
            Not sure yet? Keep exploring on your free trial and pick later.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-borderColor bg-white px-5 py-2.5 text-sm font-medium text-headingTextColor hover:bg-bgSecondary dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary dark:hover:bg-darkSecondaryBg"
          >
            Pick a plan later
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ChoosePlanPage;
