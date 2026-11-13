export const dynamic = "force-dynamic";

import { getBillingStatus, getPlans } from "@/actions/billing/action";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import BillingPageClient from "@/components/Billing/BillingPageClient";
import { ISearchParamsProps } from "@/types/type";
import { Metadata } from "next";
import { redirect } from "next/navigation";

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
    // Stamped before the read starts, so the snapshot is never older than its
    // stamp: the client adopts a server snapshot only when it is newer than the
    // last one it took (Back/Forward replays old ones — see
    // adoptServerBillingStatus).
    const statusFetchedAt = Date.now();
    // One round trip: the billing reads do not wait on the role check. Nothing
    // read is rendered before the gate below, and the API refuses billing
    // status to every role the gate turns away anyway.
    const [params, currentUser, statusRes, plansRes] = await Promise.all([
        searchParams,
        getDecodedUser(),
        getBillingStatus(),
        getPlans(),
    ]);
    const role = currentUser?.role ?? "";

    if (!["admin", "manager", "hr"].includes(role)) {
        redirect("/settings");
    }

    // Billable head count comes from billing/status itself — same rule the
    // seat gate enforces, and no member-list payload on this page.
    const activeUserCount = statusRes?.data?.active_user_count ?? 0;

    // `?tab=` is not read here: switching tabs never comes back to the server
    // (see `useBillingTab`), and the client reads the param during its own
    // server render, so the requested tab is already in the first HTML paint.
    return (
        <div>
            <BillingPageClient
                initialStatus={statusRes?.success ? statusRes.data : null}
                statusFetchedAt={statusFetchedAt}
                plans={
                    plansRes?.success && Array.isArray(plansRes.data) ? plansRes.data : []
                }
                activeUserCount={activeUserCount}
                role={role}
                blockedMessage={
                    typeof params.blocked === "string" ? params.blocked : undefined
                }
            ></BillingPageClient>
        </div>
    );
};

export default BillingPage;
