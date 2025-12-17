/* eslint-disable @typescript-eslint/no-explicit-any */
import HeadingComponent from "@/components/Common/HeadingComponent";
import ClientsTableSkeleton from "@/skeleton/projectManagement/clients/ClientsTableSkeleton";
import ClientTableServer from "@/components/ProjectManagement/Clients/ClientTableServer";
import { Suspense } from "react";
import ClientHereSection from "@/components/ProjectManagement/Clients/ClientHereSection";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import AddClientModal from "@/components/ProjectManagement/Clients/AddClientModal";;

const ClientsPage = async ({ searchParams }: any) => {
    const query = await searchParams;
    console.log('query for find the type', query);

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-5">
                <HeadingComponent heading="Clients" subHeading="All the Clients list available here"></HeadingComponent>
                <div className="">
                    <Dialog>
                        <form>
                            <DialogTrigger asChild>
                                <Button className=""><Plus className="size-5" /> <span className=" hidden sm:block">Add Client</span></Button>
                            </DialogTrigger>
                            <AddClientModal></AddClientModal>
                        </form>
                    </Dialog>
                </div>
            </div>
            
            <ClientHereSection></ClientHereSection>

            <Suspense fallback={<ClientsTableSkeleton />}>
                <ClientTableServer query={query} />
            </Suspense>
        </div>
    );
};

export default ClientsPage;