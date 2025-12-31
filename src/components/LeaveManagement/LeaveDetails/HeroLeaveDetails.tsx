"use client"
import { useState } from "react";
import LeaveRequestModal from "@/components/LeaveManagement/LeaveDetails/LeaveRequestModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

const HeroLeaveDetails = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="">
            <Dialog open={open} onOpenChange={setOpen}>
                <form>
                    <DialogTrigger asChild>
                        <Button className=""><Plus className="size-5" /> <span className=" hidden sm:block">Leave request</span></Button>
                    </DialogTrigger>
                    <LeaveRequestModal onClose={() => setOpen(false)}></LeaveRequestModal>
                </form>
            </Dialog>
        </div>
    );
};

export default HeroLeaveDetails;