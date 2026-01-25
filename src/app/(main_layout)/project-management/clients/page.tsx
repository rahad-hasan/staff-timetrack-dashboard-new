/* eslint-disable @typescript-eslint/no-explicit-any */

import ClientsTableSkeleton from "@/skeleton/projectManagement/clients/ClientsTableSkeleton";
import ClientTableServer from "@/components/ProjectManagement/Clients/ClientTableServer";
import { Suspense } from "react";
import ClientHereSection from "@/components/ProjectManagement/Clients/ClientHereSection";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Staff Time Tracker Clients",
    description: "Staff Time Tracker Clients",
};
const ClientsPage = async ({ searchParams }: any) => {
    const query = await searchParams;

    return (
        <div>
            <ClientHereSection></ClientHereSection>

            <Suspense fallback={<ClientsTableSkeleton />}>
                <ClientTableServer query={query} />
            </Suspense>
        </div>
    );
};

export default ClientsPage;