export const dynamic = "force-dynamic";

import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import {
  getBillingStatus,
  getCheckoutQuote,
  getPlans,
} from "@/actions/billing/action";
import CheckoutPageClient from "@/components/Billing/Checkout/CheckoutPageClient";
import { MAX_ORDER_SEATS } from "@/lib/billing";
import { getDecodedUser } from "@/utils/decodedLogInUser";
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
  const currentUser = await getDecodedUser();

  // Buying is admin-only everywhere else in the app; enforcing it here too
  // keeps a manager from reaching a form whose every submit would 403.
  if ((currentUser?.role ?? "") !== "admin") redirect("/settings/billing");

  const planId = Number(
    Array.isArray(params.plan) ? params.plan[0] : params.plan,
  );
  if (!Number.isFinite(planId) || planId <= 0) redirect("/settings/billing");

  const cycle = parseCycle(
    Array.isArray(params.cycle) ? params.cycle[0] : params.cycle,
  );

  const [plansRes, statusRes] = await Promise.all([
    getPlans(),
    getBillingStatus(),
  ]);

  const plans = plansRes?.success && Array.isArray(plansRes.data) ? plansRes.data : [];
  if (!plans.some((plan) => plan.id === planId)) redirect("/settings/billing");

  // The seat count chosen in the pre-checkout dialog. The floor still wins:
  // `getCheckoutQuote` clamps up to the billable head count server-side, so a
  // hand-edited (or stale) `?seats=` can never buy under it — and whatever it
  // prices is what the client then reads back as the count to purchase.
  const requestedSeats = Number(
    Array.isArray(params.seats) ? params.seats[0] : params.seats,
  );
  const activeUsers = Math.max(1, statusRes?.data?.active_user_count ?? 1);
  const seats =
    Number.isFinite(requestedSeats) && requestedSeats > 0
      ? Math.max(activeUsers, Math.min(MAX_ORDER_SEATS, Math.floor(requestedSeats)))
      : activeUsers;

  const quoteRes = await getCheckoutQuote({ plan_id: planId, seats, cycle });

  return (
    <div className="min-h-screen w-full bg-bgSecondary dark:bg-darkSecondaryBg">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/settings/billing"
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
      </div>
    </div>
  );
};

export default CheckoutPage;
