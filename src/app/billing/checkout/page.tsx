export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getCheckoutQuote, getPlans } from "@/actions/billing/action";
import CheckoutPageClient from "@/components/Billing/Checkout/CheckoutPageClient";
import AccountSwitchWatcher from "@/components/Common/AccountSwitchWatcher";
import { MAX_ORDER_SEATS } from "@/lib/billing";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import { getViewerTimeZone } from "@/lib/server/session";
import { ViewerTimeZoneProvider } from "@/components/Common/ViewerTimeZone";
import { BILLING_CYCLES, type BillingCycle } from "@/types/billing";

export const metadata: Metadata = {
  title: "Complete your subscription",
  description: "Review your order and pay securely",
};

const parseCycle = (raw: string | undefined): BillingCycle =>
  BILLING_CYCLES.includes(raw as BillingCycle)
    ? (raw as BillingCycle)
    : "monthly";

/**
 * `/billing/checkout` — the custom checkout.
 *
 * Lives OUTSIDE `(main_layout)` deliberately, the same standalone pattern as
 * `/billing/success` and `/onboarding/choose-plan`: it is reached straight from
 * onboarding, before the sidebar, the billing store or `BillingGate` have any
 * business existing, and a payment-blocked account must be able to reach it
 * without the gate bouncing it away.
 *
 * The first quote is fetched here rather than on the client so the order panel
 * paints with real money on the first frame — an empty summary beside a card
 * form reads as a broken page.
 */
const CheckoutPage = async ({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) => {
  const params = await searchParams;

  const planId = Number(
    Array.isArray(params.plan) ? params.plan[0] : params.plan,
  );
  if (!Number.isFinite(planId) || planId <= 0) redirect("/settings/billing");

  const cycle = parseCycle(
    Array.isArray(params.cycle) ? params.cycle[0] : params.cycle,
  );

  // The seat count chosen in the pre-checkout dialog, kept inside the range
  // any order can have. No head-count read is needed for the floor:
  // `getCheckoutQuote` clamps up to the billable head count server-side, so a
  // hand-edited (or stale, or missing) `?seats=` can never buy under it — and
  // whatever it prices is what the client then reads back as the count to
  // purchase (`initialQuote.seats`).
  const requestedSeats = Number(
    Array.isArray(params.seats) ? params.seats[0] : params.seats,
  );
  const seats =
    Number.isFinite(requestedSeats) && requestedSeats > 0
      ? Math.min(MAX_ORDER_SEATS, Math.floor(requestedSeats))
      : 1;

  // One round trip for everything the first paint needs: none of these reads
  // depends on another. The quote is `auth('admin')` server-side, so starting
  // it before the role check below costs a non-admin one refused request and
  // gives the admin — the only one who ever gets past it — no extra wait. A
  // plan id missing from the list is refused by the quote too.
  const [currentUser, plansRes, quoteRes, viewerZone] = await Promise.all([
    getDecodedUser(),
    getPlans(),
    getCheckoutQuote({ plan_id: planId, seats, cycle }),
    // This page sits outside (main_layout), whose layout provides the zone
    // everywhere else. Without it "Renews on" rendered in UTC on the server
    // and in the viewer's zone after hydration. Shares the session read above.
    getViewerTimeZone(),
  ]);

  // Buying is admin-only everywhere else in the app; enforcing it here too
  // keeps a manager from reaching a form whose every submit would 403.
  if ((currentUser?.role ?? "") !== "admin") redirect("/settings/billing");

  const plans = plansRes?.success && Array.isArray(plansRes.data) ? plansRes.data : [];
  if (!plans.some((plan) => plan.id === planId)) redirect("/settings/billing");

  return (
    <div className="min-h-screen w-full bg-bgSecondary dark:bg-darkSecondaryBg">
      {/* Outside (main_layout), so no SessionSync: without this, an order
          started here for one admin would be paid with the session cookie of
          whoever signs in next on this browser. */}
      <AccountSwitchWatcher userId={currentUser?.id} />
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Not prefetched: from outside (main_layout) a prefetch of the
            billing page renders the whole dashboard layout, billing status
            included, and that pre-purchase snapshot would be applied after
            the payment. */}
        <Link
          href="/settings/billing"
          prefetch={false}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>

        <header className="mt-6 mb-6">
          <h1 className="text-2xl font-bold text-headingTextColor dark:text-darkTextPrimary sm:text-3xl">
            Complete Your Subscription
          </h1>
          <p className="mt-1.5 text-subTextColor dark:text-darkTextSecondary">
            You are one step from upgrading. You can pick any other package and
            pay securely.
          </p>
        </header>

        <ViewerTimeZoneProvider zone={viewerZone}>
        <CheckoutPageClient
          plans={plans}
          planId={planId}
          initialCycle={cycle}
          initialSeats={seats}
          initialQuote={quoteRes?.success ? (quoteRes.data ?? null) : null}
          // The server's own reason, not a generic line. A quote can be refused
          // for something the user can act on — "you have 12 active users but
          // this plan allows up to 10, pick a bigger plan" — and swallowing it
          // left them staring at "try again" on an order that can never price.
          initialQuoteError={
            quoteRes?.success ? null : (quoteRes?.message ?? null)
          }
        />
        </ViewerTimeZoneProvider>
      </div>
    </div>
  );
};

export default CheckoutPage;
