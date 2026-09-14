import CheckoutSuccessClient from "@/components/Billing/CheckoutSuccessClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Checkout Complete",
    description: "Finalizing your subscription",
};

/** Repeated `?foo=a&foo=b` arrives as an array; only a lone string is a usable id. */
const readParam = (value: string | string[] | undefined): string | null =>
    typeof value === "string" && value.length > 0 ? value : null;

/**
 * Where both purchase paths land, and they arrive with different references:
 *
 *  - `?session_id=cs_…`       Stripe-hosted Checkout — confirmed via
 *                             `packages/checkout/confirm`.
 *  - `?subscription_id=sub_…` the in-app Payment Element checkout, which never
 *                             creates a session — confirmed via
 *                             `packages/subscription/confirm`.
 *
 * Exactly one is present; the client picks the matching confirm endpoint,
 * which syncs the subscription straight from Stripe (no webhook required) and
 * polls `billing/status` as the fallback. With neither param it renders the
 * failed state rather than waiting on something that will never arrive.
 *
 * The page sits OUTSIDE `(main_layout)` — it is reached from onboarding before
 * the billing store exists — so the ground is painted here.
 */
const CheckoutSuccessPage = async ({
    searchParams,
}: {
    searchParams: Promise<{
        session_id?: string | string[];
        subscription_id?: string | string[];
    }>;
}) => {
    const params = await searchParams;

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-[#e8f2ff] via-[#f4f9ff] to-bgSecondary p-4 dark:from-darkSecondaryBg dark:via-darkSecondaryBg dark:to-darkSecondaryBg">
            <CheckoutSuccessClient
                sessionId={readParam(params.session_id)}
                subscriptionId={readParam(params.subscription_id)}
            ></CheckoutSuccessClient>
        </div>
    );
};

export default CheckoutSuccessPage;
