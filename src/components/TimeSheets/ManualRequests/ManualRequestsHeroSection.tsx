"use client"
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
    Dialog,
} from "@/components/ui/dialog";
import AddManualTimeModal from "@/components/TimeSheets/ManualRequests/AddManualTimeModal";
import { useState } from "react";
const ManualRequestsHeroSection = () => {
    const [open, setOpen] = useState(false);
    return (
        <div className="">
            <Dialog open={open} onOpenChange={setOpen}>
                {/* ❌ You must NOT use DialogTrigger when the Dialog is fully controlled
                DialogTrigger for this flicker happen */}
                <Button onClick={() => setOpen(true)} className=""><Plus className="size-5" /> <span className=" hidden sm:block">Add Time</span></Button>
                <AddManualTimeModal onClose={() => setOpen(false)}></AddManualTimeModal>
            </Dialog>
        </div>
    );
};

export default ManualRequestsHeroSection;