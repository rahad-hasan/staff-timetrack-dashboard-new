"use client"
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog";
import AddManualTimeModal from "@/components/TimeSheets/ManualRequests/AddManualTimeModal";
import { useState } from "react";
const ManualRequestsHeroSection = () => {
    const [open, setOpen] = useState(false);
    return (
        <div className="">
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button className=""><Plus className="size-5" /> <span className=" hidden sm:block">Add Time</span></Button>
                </DialogTrigger>
                <AddManualTimeModal onClose={() => setOpen(false)}></AddManualTimeModal>
            </Dialog>

        </div>
    );
};

export default ManualRequestsHeroSection;