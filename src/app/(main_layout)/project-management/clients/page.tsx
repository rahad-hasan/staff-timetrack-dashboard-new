/* eslint-disable @typescript-eslint/no-explicit-any */

import ClientsTableSkeleton from "@/skeleton/projectManagement/clients/ClientsTableSkeleton";
import ClientTableServer from "@/components/ProjectManagement/Clients/ClientTableServer";
import { Suspense } from "react";
import ClientHereSection from "@/components/ProjectManagement/Clients/ClientHereSection";


const ClientsPage = async ({ searchParams }: any) => {
    const query = await searchParams;
    console.log('query for find the type', query);

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