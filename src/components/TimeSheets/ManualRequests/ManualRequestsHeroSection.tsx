"use client"
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { loadOrReload } from "@/lib/lazyChunk";
import { useState } from "react";

// The Add Time form (zod, react-hook-form, the calendar, Radix Select) is only
// needed once someone opens it, so it is its own chunk instead of part of
// every visit to the approval queue. Hovering or focusing the button starts
// the download early (same chunk, fetched once); the placeholder covers a
// click that beats it.
const importAddManualTimeModal = () => import("./AddManualTimeModal");
const loadAddManualTimeModal = loadOrReload(importAddManualTimeModal);
const AddManualTimeModal = dynamic(loadAddManualTimeModal, {
    ssr: false,
    loading: () => (
        <DialogContent
            aria-describedby={undefined}
            className=" w-full sm:max-w-131.25"
        >
            <DialogTitle>Add Time</DialogTitle>
            <div className="flex justify-center py-10">
                <Loader2 className="size-6 animate-spin text-primary" />
            </div>
        </DialogContent>
    ),
});

const preloadAddManualTimeModal = () => {
    // A failed warm-up is harmless: opening the dialog requests the chunk again.
    importAddManualTimeModal().catch(() => {});
};

const ManualRequestsHeroSection = ({ isAdmin }: { isAdmin: boolean }) => {
    const [open, setOpen] = useState(false);

    return (
        <div className="">
            <Dialog open={open} onOpenChange={setOpen}>
                {/* ❌ You must NOT use DialogTrigger when the Dialog is fully controlled
                DialogTrigger for this flicker happen */}
                <Button
                    onClick={() => setOpen(true)}
                    onPointerEnter={preloadAddManualTimeModal}
                    onFocus={preloadAddManualTimeModal}
                    className=""
                ><Plus className="size-5" /> <span className=" hidden sm:block">Add Time</span></Button>
                {open ? (
                    <AddManualTimeModal
                        isAdmin={isAdmin}
                        onClose={() => setOpen(false)}
                    />
                ) : null}
            </Dialog>
        </div>
    );
};

export default ManualRequestsHeroSection;
