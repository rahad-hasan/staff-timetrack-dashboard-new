"use client"
import HeadingComponent from "@/components/Common/HeadingComponent";
import { useEffect, useState } from "react";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import AddClientModal from "@/components/ProjectManagement/Clients/AddClientModal";;

const ClientHereSection = () => {
    const [open, setOpen] = useState(false)
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();
    useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", "1");

        router.push(`?${params.toString()}`);
    }, [searchParams, router]);

    useEffect(() => {
        // If there are any search params at all, clear them on mount
        if (searchParams.toString()) {
            router.replace(pathname, { scroll: false });
        }
    }, []);


    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-5">
                <HeadingComponent heading="Clients" subHeading="All the Clients list available here"></HeadingComponent>
                <div className="">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <form>
                            <DialogTrigger asChild>
                                <Button className=""><Plus className="size-5" /> <span className=" hidden sm:block">Add Client</span></Button>
                            </DialogTrigger>
                            <AddClientModal onClose={() => setOpen(false)}></AddClientModal>
                        </form>
                    </Dialog>
                </div>
            </div>
            <SelectProjectDropDown></SelectProjectDropDown>
        </div>
    );
};

export default ClientHereSection;