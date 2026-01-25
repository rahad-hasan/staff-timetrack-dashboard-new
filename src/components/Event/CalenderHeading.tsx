"use client"
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import AddEventModal from "@/components/Event/AddEventModal";
import HeadingComponent from "@/components/Common/HeadingComponent";
import { useState } from "react";
import { useLogInUserStore } from "@/store/logInUserStore";

const CalenderHeading = () => {
    const [open, setOpen] = useState(false)
    const logInUserData = useLogInUserStore(state => state.logInUserData);
    return (
        <div className="flex items-center justify-between gap-3 mb-5">
            <HeadingComponent heading="Event" subHeading="All the teams task and events are displayed here"></HeadingComponent>
            {
                (logInUserData?.role === 'admin' ||
                    logInUserData?.role === 'manager' ||
                    logInUserData?.role === 'hr') &&
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setOpen(true)} className=""><Plus className="size-5" /> <span className=" hidden sm:block">Add an event</span></Button>
                    </DialogTrigger>
                    <AddEventModal onClose={() => setOpen(false)}></AddEventModal>
                </Dialog>
            }
        </div>
    );
};

export default CalenderHeading;