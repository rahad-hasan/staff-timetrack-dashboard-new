/* eslint-disable @typescript-eslint/no-explicit-any */

import ClientsTableSkeleton from "@/skeleton/projectManagement/clients/ClientsTableSkeleton";
import ClientTableServer from "@/app/(main_layout)/project-management/clients/_components/ClientTableServer";
import { Suspense } from "react";
import ClientHereSection from "@/app/(main_layout)/project-management/clients/_components/ClientHereSection";
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