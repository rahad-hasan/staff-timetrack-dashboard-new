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
import dynamic from "next/dynamic";
import { loadOrReload } from "@/lib/lazyChunk";
import { useLatched } from "@/lib/onboarding/useLatched";
import { DialogChunkPlaceholder } from "@/components/Common/DialogChunkPlaceholder";
import { useCreateIntent } from "@/store/quickActionStore";

// The add form (zod, react-hook-form, the phone field with libphonenumber-js
// and the country tables: about 90 kB gzipped) is its own chunk, fetched when
// the dialog first opens instead of with every visit to the client list.
// Hovering or focusing the button starts the download; the placeholder covers
// a click that beats it and keeps `[data-slot=dialog-content]` present for the
// onboarding tour.
const importAddClientModal = () => import("@/components/ProjectManagement/Clients/AddClientModal");
const loadAddClientModal = loadOrReload(importAddClientModal);
const AddClientModal = dynamic(loadAddClientModal, {
    ssr: false,
    loading: () => (
        <DialogChunkPlaceholder
            title="Add New Client"
            titleClassName=" mb-4 text-headingTextColor dark:text-darkTextPrimary"
            className="sm:max-w-131.25"
        />
    ),
});

// The raw import, never the loader above: a warm-up must not reload the page.
const warmAddClientModal = () => {
    importAddClientModal().catch(() => {});
};

const ClientHereSection = () => {
    const [open, setOpen] = useState(false)
    // The form mounts with the first open and then stays mounted, as it was
    // when it shipped with the page: a half-typed client survives closing the
    // dialog and opening it again.
    const formMounted = useLatched(open)

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
                                <Button data-tour={TOUR_ANCHORS.ctaAddClient} onPointerEnter={warmAddClientModal} onFocus={warmAddClientModal} className=""><Plus className="size-5" /> <span className=" hidden sm:block">Add Client</span></Button>
                            </DialogTrigger>
                            {formMounted && <AddClientModal onClose={() => setOpen(false)}></AddClientModal>}
                        </form>
                    </Dialog>
                </div>
            </div>
            {/* <SelectProjectDropDown></SelectProjectDropDown> */}
        </div>
    );
};

export default ClientHereSection;