export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Crown } from "lucide-react";

import { getBillingStatus, getPlans } from "@/actions/billing/action";
import { canMutateSubscription, daysUntil } from "@/lib/billing";
import { parseMarketingPlanIntent } from "@/lib/marketingPlanIntent";
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
 *
 * It is also the landing point of the marketing funnel: someone who clicked a
 * paid plan on the website carries `?plan=` (and sometimes `?cycle=`) all the
 * way through signup, and re-asking them to choose is the wrong answer. The
 * params are parsed here and handed down; the picker validates them against the
 * catalog and opens the seat dialog over this grid when they hold up. Parsing
 * is all this page does with them — every rejection has to fall back to the
 * grid below, which means the decision belongs where the catalog is, not here.
 */
const ChoosePlanPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const [params, currentUser] = await Promise.all([
    searchParams,
    getDecodedUser(),
  ]);

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

  // The marketing site's choice, normalised (`trail`/`trial`, cycle, plan id)
  // but NOT yet validated — it is still just "a plan the user may have meant"
  // until the picker checks it against `plans`.
  const intent = parseMarketingPlanIntent(params);

  const trialDaysLeft =
    entitlements?.status === "trialing" && entitlements.trial_ends_at
      ? daysUntil(entitlements.trial_ends_at)
      : null;

  // The top wash was seeded with the old brand green (#12cd69). `--primary` is
  // the blue #0788f3 in both themes now and the headline leans on it, so the
  // gradient tints from that token rather than a hardcoded hue nothing else in
  // the app still uses.
  return (
    <div className="min-h-screen w-full bg-linear-to-b from-primary/8 from-5% to-bgSecondary dark:to-darkSecondaryBg to-20%">
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
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Pricing
          </span>

          {/* Two sentences, one of them in brand blue — the emphasis is the
              design's, and it is the same `--primary` the cards' CTAs use, so
              the headline cannot drift from the buttons under it. */}
          <h1 className="mt-4 text-3xl font-semibold text-headingTextColor dark:text-darkTextPrimary sm:text-4xl">
            Simple pricing.{" "}
            <span className="text-primary">Powerful features</span>
          </h1>
          <p className="mt-3 text-subTextColor dark:text-darkTextSecondary">
            Choose the plan that fits your team. All plans are per user, per
            month.
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
          intent={intent}
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
