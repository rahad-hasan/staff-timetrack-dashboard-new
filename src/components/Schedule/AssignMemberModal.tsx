"use client"
import InviteMemberIcon from "../Icons/InviteMemberIcon";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog";
import dynamic from "next/dynamic";
import { useState } from "react";
import { DialogChunkPlaceholder } from "@/components/Common/DialogChunkPlaceholder";
import { loadOrReload } from "@/lib/lazyChunk";
import { ISchedules } from "@/types/type";

// The form (zod, react-hook-form, the multi-select, Radix Select) is its own
// chunk, fetched when the dialog first opens instead of with every visit to a
// schedule. Hovering or focusing the button starts the download; the
// placeholder covers a click that beats it.
const importAssignMemberForm = () => import("./AssignMemberForm");
const loadAssignMemberForm = loadOrReload(importAssignMemberForm);
const AssignMemberForm = dynamic(loadAssignMemberForm, {
    ssr: false,
    loading: () => (
        <DialogChunkPlaceholder
            title="Assign Member"
            titleClassName=" mb-4 text-headingTextColor dark:text-darkTextPrimary"
            className=" w-full sm:max-w-[525px] max-h-[95vh] overflow-y-auto"
        />
    ),
});

// The raw import, never the loader above: a warm-up must not reload the page.
const warmAssignMemberForm = () => {
    importAssignMemberForm().catch(() => {});
};

const AssignMemberModal = ({ schedule }: { schedule: ISchedules }) => {
    const [open, setOpen] = useState(false)

    return (
        <div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <div className="mt-6 pt-6 border-t border-dashed border-borderColor dark:border-darkBorder">
                        <Button onClick={() => setOpen(true)} onPointerEnter={warmAssignMemberForm} onFocus={warmAssignMemberForm} className="">
                            <InviteMemberIcon size={20} />  Assign Member
                        </Button>
                    </div>
                </DialogTrigger>

                {/* Mounted per open: the project and member lists are only
                    fetched for a dialog someone opened, and each open starts
                    from the schedule's current assignment. */}
                {open && (
                    <AssignMemberForm schedule={schedule} onDone={() => setOpen(false)} />
                )}
            </Dialog>
        </div>
    );
};

export default AssignMemberModal;
