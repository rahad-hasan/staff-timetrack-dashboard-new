import CheckoutSuccessClient from "@/components/Billing/CheckoutSuccessClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Checkout Complete",
    description: "Finalizing your subscription",
};

/**
 * Stripe returns the browser here after a successful checkout
 * (`/billing/success?session_id=…`). The client hands the session_id to
 * `packages/checkout/confirm`, which syncs the subscription straight from
 * Stripe (no webhook required), and polls `billing/status` as a fallback
 * until `status === "active"`.
 */
const CheckoutSuccessPage = async ({
    searchParams,
}: {
    searchParams: Promise<{ session_id?: string | string[] }>;
}) => {
    const params = await searchParams;
    const sessionId =
        typeof params.session_id === "string" ? params.session_id : null;

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-bgSecondary dark:bg-darkSecondaryBg p-4">
            <CheckoutSuccessClient sessionId={sessionId}></CheckoutSuccessClient>
        </div>
    );
};

export default CheckoutSuccessPage;
