export const dynamic = "force-dynamic";

import { getBillingStatus, getPlans } from "@/actions/billing/action";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import BillingPageClient from "@/components/Billing/BillingPageClient";
import HeadingComponent from "@/components/Common/HeadingComponent";
import { ISearchParamsProps } from "@/types/type";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export const metadata: Metadata = {
    title: "Billing & Plans",
    description: "Manage your subscription, seats and invoices",
};

/**
 * `/settings/billing` — the page every `block.webBillingUrl` and 402 redirect
 * lands on. Billing reads are allowed for admin / manager / hr (guide §0);
 * everyone else goes back to Settings. Mutation buttons are additionally
 * admin-gated inside the components.
 */
const BillingPage = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const currentUser = await getDecodedUser();
    const role = currentUser?.role ?? "";

    if (!["admin", "manager", "hr"].includes(role)) {
        redirect("/settings");
    }

    const [statusRes, plansRes] = await Promise.all([
        getBillingStatus(),
        getPlans(),
    ]);

    // Billable head count comes from billing/status itself — same rule the
    // seat gate enforces, and no member-list payload on this page.
    const activeUserCount = statusRes?.data?.active_user_count ?? 0;
    console.log(statusRes.data)

    return (
        <div>
            <BillingPageClient
                initialStatus={statusRes?.success ? statusRes.data : null}
                plans={
                    plansRes?.success && Array.isArray(plansRes.data) ? plansRes.data : []
                }
                activeUserCount={activeUserCount}
                role={role}
                blockedMessage={
                    typeof params.blocked === "string" ? params.blocked : undefined
                }
                // `?tab=` is read here purely so the requested tab is in the
                // first HTML paint; the client hook validates it (and drops
                // `change-card` for manager/hr) and owns it from then on.
                initialTab={
                    typeof params.tab === "string" ? params.tab : undefined
                }
            ></BillingPageClient>
        </div>
    );
};

export default BillingPage;
