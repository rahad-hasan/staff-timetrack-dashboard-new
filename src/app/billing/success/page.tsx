import CheckoutSuccessClient from "@/components/Billing/CheckoutSuccessClient";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Checkout Complete",
    description: "Finalizing your subscription",
};

/**
 * Stripe returns the browser here after a successful checkout
 * (`/billing/success?session_id=…`). Activation is webhook-driven, so the
 * client polls `billing/status` until `status === "active"` (usually < 5 s).
 */
const CheckoutSuccessPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-bgSecondary dark:bg-darkSecondaryBg p-4">
            <CheckoutSuccessClient></CheckoutSuccessClient>
        </div>
    );
};

export default CheckoutSuccessPage;
