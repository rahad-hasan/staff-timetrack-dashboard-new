import { Metadata } from "next";
import Link from "next/link";
import { XCircle } from "lucide-react";

export const metadata: Metadata = {
    title: "Checkout Canceled",
    description: "Your checkout was canceled",
};

/** Stripe returns the browser here when the user backs out of checkout. */
const CheckoutCancelPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-bgSecondary dark:bg-darkSecondaryBg p-4">
            <div className="w-full max-w-md border border-borderColor rounded-lg p-6 sm:p-8 bg-white dark:bg-darkPrimaryBg dark:border-darkBorder text-center">
                <XCircle className="h-12 w-12 mx-auto text-subTextColor dark:text-darkTextSecondary mb-4" />
                <h1 className="text-xl font-medium text-headingTextColor dark:text-darkTextPrimary mb-2">
                    Checkout canceled
                </h1>
                <p className="text-sm text-subTextColor dark:text-darkTextSecondary mb-6">
                    No charges were made. You can pick a plan again whenever
                    you&apos;re ready.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        href="/settings/billing"
                        className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium hover:opacity-90"
                    >
                        Back to plans
                    </Link>
                    <Link
                        href="/dashboard"
                        className="px-4 py-2 rounded-md border border-borderColor dark:border-darkBorder text-sm font-medium text-headingTextColor dark:text-darkTextPrimary hover:bg-bgSecondary dark:hover:bg-darkSecondaryBg"
                    >
                        Go to dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CheckoutCancelPage;
