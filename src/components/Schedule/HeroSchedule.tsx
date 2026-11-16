"use client"
import { Plus } from "lucide-react";
import HeadingComponent from "../Common/HeadingComponent";
import { Button } from "../ui/button";
import { Dialog, DialogTrigger } from "../ui/dialog";
import { useState } from "react";
import dynamic from "next/dynamic";
import { loadOrReload } from "@/lib/lazyChunk";
import { useLatched } from "@/lib/onboarding/useLatched";
import { DialogChunkPlaceholder } from "@/components/Common/DialogChunkPlaceholder";

// The create form (zod, react-hook-form) is its own chunk, fetched when the
// dialog first opens instead of with every visit to the schedule list.
// Hovering or focusing the button starts the download; the placeholder covers
// a click that beats it.
const importAddScheduleModal = () => import("./AddScheduleModal");
const loadAddScheduleModal = loadOrReload(importAddScheduleModal);
const AddScheduleModal = dynamic(loadAddScheduleModal, {
    ssr: false,
    loading: () => (
        <DialogChunkPlaceholder
            title="Create Schedule"
            titleClassName=" mb-4"
            className="sm:max-w-[525px] max-h-[95vh] overflow-y-auto"
        />
    ),
});

// The raw import, never the loader above: a warm-up must not reload the page.
const warmAddScheduleModal = () => {
    importAddScheduleModal().catch(() => {});
};

const HeroSchedule = () => {
    const [open, setOpen] = useState(false)
    // The form mounts with the first open and then stays mounted, as it was
    // when it shipped with the page: what was typed survives closing the
    // dialog and opening it again.
    const formMounted = useLatched(open)
    return (
        <div className=" flex items-center justify-between">
            <HeadingComponent heading="Schedule Management" subHeading="All the teams member schedule details are displayed here"></HeadingComponent>
            <Dialog open={open} onOpenChange={setOpen}>
                <form>
                    <DialogTrigger asChild>
                        <Button onPointerEnter={warmAddScheduleModal} onFocus={warmAddScheduleModal} className=" text-sm md:text-base py-2"><Plus className="size-5" /> <span className=" hidden sm:block">Create Schedule</span></Button>
                    </DialogTrigger>
                    {formMounted && <AddScheduleModal onClose={() => setOpen(false)}></AddScheduleModal>}
                </form>
            </Dialog>
        </div>
    );
};

export default HeroSchedule;