"use client"
import HeadingComponent from "@/components/Common/HeadingComponent";
import { TOUR_ANCHORS } from "@/lib/onboarding/anchors";
import { useState } from "react";
// import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import AddClientModal from "@/components/ProjectManagement/Clients/AddClientModal";
import { useCreateIntent } from "@/store/quickActionStore";

const ClientHereSection = () => {
    const [open, setOpen] = useState(false)

    // "Add client" pressed elsewhere (Quick Setup, the checklist widget, ⌘K)
    // navigates here and leaves the intent in the store; claim it and open the
    // form, so the click the user already made is the only one they need.
    useCreateIntent("client", () => setOpen(true));

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-5">
                <HeadingComponent heading="Clients" subHeading="All the Clients list available here"></HeadingComponent>
                <div className="">
                    <Dialog open={open} onOpenChange={setOpen}>
                        <form>
                            <DialogTrigger asChild>
                                <Button data-tour={TOUR_ANCHORS.ctaAddClient} className=""><Plus className="size-5" /> <span className=" hidden sm:block">Add Client</span></Button>
                            </DialogTrigger>
                            <AddClientModal onClose={() => setOpen(false)}></AddClientModal>
                        </form>
                    </Dialog>
                </div>
            </div>
            {/* <SelectProjectDropDown></SelectProjectDropDown> */}
        </div>
    );
};

export default ClientHereSection;