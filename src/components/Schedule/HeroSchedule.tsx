"use client"
import { Plus } from "lucide-react";
import HeadingComponent from "../Common/HeadingComponent";
import { Button } from "../ui/button";
import { Dialog, DialogTrigger } from "../ui/dialog";
import { useState } from "react";
import AddScheduleModal from "./AddScheduleModal";

const HeroSchedule = () => {
    const [open, setOpen] = useState(false)
    return (
        <div className=" flex items-center justify-between">
            <HeadingComponent heading="Schedule Management" subHeading="All the teams member schedule details are displayed here"></HeadingComponent>
            <Dialog open={open} onOpenChange={setOpen}>
                <form>
                    <DialogTrigger asChild>
                        <Button className=" text-sm md:text-base py-2"><Plus className="size-5" /> <span className=" hidden sm:block">Create Schedule</span></Button>
                    </DialogTrigger>
                    <AddScheduleModal onClose={() => setOpen(false)}></AddScheduleModal>
                </form>
            </Dialog>
        </div>
    );
};

export default HeroSchedule;