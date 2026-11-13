"use client";
import { Loader2, Plus } from "lucide-react";
import dynamic from "next/dynamic";
import { loadOrReload } from "@/lib/lazyChunk";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useLogInUserStore } from "@/store/logInUserStore";
import GoogleConnectButton from "./GoogleConnectButton";
import TeamsConnectButton from "./TeamsConnectButton";
import CalendarIcon from "../Icons/CalendarIcon";
import VideoIcon from "../Icons/VideoIcon";

const importAddEventModal = () => import("@/components/Event/AddEventModal");
const loadAddEventModal = loadOrReload(importAddEventModal);

/**
 * The create form carries the rich-text editor (TipTap/ProseMirror, ~124 KB
 * gz) — downloaded only when someone is about to create an event, not by
 * every visitor of the calendar. Hovering or focusing "New event" warms it.
 *
 * Until it arrives, the dialog opens with a spinner in it. Rendering nothing
 * there looked like a click that did nothing — on a cold or slow connection,
 * or on touch, where there is no hover to warm the chunk — and the second
 * click it invited toggled the dialog shut before it ever appeared. With the
 * placeholder up, its overlay takes that click, and an outside click does not
 * close it (as with the real form).
 */
const AddEventModal = dynamic(loadAddEventModal, {
    ssr: false,
    loading: () => (
        <DialogContent
            aria-describedby={undefined}
            onInteractOutside={(event) => event.preventDefault()}
            className="w-full max-w-[calc(100vw-2rem)] sm:max-w-[760px] lg:max-w-[1120px]"
        >
            <DialogTitle>Create new event</DialogTitle>
            <div className="flex justify-center py-10">
                <Loader2 className="size-6 animate-spin text-primary" />
            </div>
        </DialogContent>
    ),
});

const warmAddEventModal = () => {
    importAddEventModal().catch(() => {});
};

const CalenderHeading = () => {
    const [open, setOpen] = useState(false);
    const logInUserData = useLogInUserStore((state) => state.logInUserData);
    const canCreate =
        logInUserData?.role === "admin" ||
        logInUserData?.role === "manager" ||
        logInUserData?.role === "hr" ||
        logInUserData?.role === "project_manager";

    return (
        <div className="relative mb-6 overflow-hidden rounded-lg border border-borderColor/70 bg-linear-to-br from-primary/10 via-cyan-500/6 to-white dark:border-darkBorder dark:from-primary/14 dark:via-cyan-500/8 dark:to-darkSecondaryBg">
            <div className="absolute -right-20 -top-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15" />
            <div className="absolute -left-24 -bottom-16 h-48 w-48 rounded-full bg-cyan-500/8 blur-3xl dark:bg-cyan-500/10" />

            <div className="relative flex flex-col gap-6 px-5 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-4">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        <CalendarIcon size={16} />
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
                        <div className="inline-flex items-center gap-2 rounded-lg border border-borderColor bg-bgSecondary/60 px-3 py-2 text-xs font-medium text-headingTextColor  dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary">
                            <CalendarIcon size={14} className="text-primary"/>
                            Monthly planning
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-lg border border-borderColor bg-bgSecondary/60 px-3 py-2 text-xs font-medium text-headingTextColor  dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary">
                            <VideoIcon size={14} className="text-primary"/>
                            Meeting link sync
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                    <GoogleConnectButton />
                    <TeamsConnectButton />
                    {canCreate && (
                        <Dialog open={open} onOpenChange={setOpen}>
                            {/* The trigger alone opens it (through onOpenChange).
                                A second onClick of our own made each click run
                                "open" and then the trigger's toggle — which
                                closed the dialog on any click that reached the
                                button while it was already open. The trigger
                                also gives focus back to this button on close. */}
                            <DialogTrigger asChild>
                                <Button
                                    onPointerEnter={warmAddEventModal}
                                    onFocus={warmAddEventModal}
                                    className="h-11 rounded-lg px-4"
                                >
                                    <Plus className="size-4" />
                                    <span>New event</span>
                                </Button>
                            </DialogTrigger>
                            {/* Mounted per open: every open reads the attendee list and
                                the Google / Teams connection state afresh, so a connect
                                or disconnect done from the header buttons is reflected. */}
                            {open && <AddEventModal onClose={() => setOpen(false)} />}
                        </Dialog>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CalenderHeading;