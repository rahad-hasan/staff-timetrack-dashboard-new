"use client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import AddEventModal from "@/components/Event/AddEventModal";
import HeadingComponent from "@/components/Common/HeadingComponent";
import { useState } from "react";
import { useLogInUserStore } from "@/store/logInUserStore";
import GoogleConnectButton from "./GoogleConnectButton";

const CalenderHeading = () => {
    const [open, setOpen] = useState(false);
    const logInUserData = useLogInUserStore((state) => state.logInUserData);
    const canCreate =
        logInUserData?.role === "admin" ||
        logInUserData?.role === "manager" ||
        logInUserData?.role === "hr" ||
        logInUserData?.role === "project_manager";

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <HeadingComponent
                heading="Event"
                subHeading="All the teams task and events are displayed here"
            />
            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                <GoogleConnectButton />
                {canCreate && (
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setOpen(true)}>
                                <Plus className="size-5" />
                                <span className="hidden sm:block">New event</span>
                            </Button>
                        </DialogTrigger>
                        <AddEventModal onClose={() => setOpen(false)} />
                    </Dialog>
                )}
            </div>
        </div>
    );
};

export default CalenderHeading;
