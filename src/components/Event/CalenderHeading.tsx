"use client";
import { CalendarDays, Plus, Sparkles, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import AddEventModal from "@/components/Event/AddEventModal";
import { useState } from "react";
import { useLogInUserStore } from "@/store/logInUserStore";
import GoogleConnectButton from "./GoogleConnectButton";
import TeamsConnectButton from "./TeamsConnectButton";

const CalenderHeading = () => {
    const [open, setOpen] = useState(false);
    const logInUserData = useLogInUserStore((state) => state.logInUserData);
    const canCreate =
        logInUserData?.role === "admin" ||
        logInUserData?.role === "manager" ||
        logInUserData?.role === "hr" ||
        logInUserData?.role === "project_manager";

    return (
        <div className="relative mb-6 overflow-hidden rounded-lg border border-borderColor/70 bg-linear-to-br from-primary/10 via-cyan-500/6 to-white shadow-sm dark:border-darkBorder dark:from-primary/14 dark:via-cyan-500/8 dark:to-darkSecondaryBg">
            <div className="absolute -right-20 -top-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15" />
            <div className="absolute -left-24 -bottom-16 h-48 w-48 rounded-full bg-cyan-500/8 blur-3xl dark:bg-cyan-500/10" />

            <div className="relative flex flex-col gap-6 px-5 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-4">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        <Sparkles className="size-3.5" />
                        Calendar workspace
                    </span>

                    <div>
                        <h1 className="text-2xl font-semibold text-headingTextColor dark:text-darkTextPrimary sm:text-3xl">
                            Events
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-subTextColor dark:text-darkTextSecondary sm:text-base">
                            Plan meetings, manage attendees, and review synced Google Meet or
                            Teams sessions from a cleaner monthly calendar view.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="inline-flex items-center gap-2 rounded-lg border border-borderColor bg-bgSecondary/60 px-3 py-2 text-xs font-medium text-headingTextColor shadow-sm dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary">
                            <CalendarDays className="size-4 text-primary" />
                            Monthly planning
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-lg border border-borderColor bg-bgSecondary/60 px-3 py-2 text-xs font-medium text-headingTextColor shadow-sm dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary">
                            <Video className="size-4 text-primary" />
                            Meeting link sync
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                    <GoogleConnectButton />
                    <TeamsConnectButton />
                    {canCreate && (
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    onClick={() => setOpen(true)}
                                    className="h-11 rounded-lg px-4 shadow-sm"
                                >
                                    <Plus className="size-4" />
                                    <span>New event</span>
                                </Button>
                            </DialogTrigger>
                            <AddEventModal onClose={() => setOpen(false)} />
                        </Dialog>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalenderHeading;
