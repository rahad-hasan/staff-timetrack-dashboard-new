/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cancelEvent } from "@/actions/calendarEvent/action";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

const CancelEventDialog = ({
    open,
    onOpenChange,
    event,
    onCancelled,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event: any;
    onCancelled?: () => void;
}) => {
    const [loading, setLoading] = useState(false);
    const attendeeCount = event?.eventAssigns?.length ?? 0;

    const handleConfirm = async (e: React.MouseEvent) => {
        e.preventDefault();
        if (!event?.id) return;
        setLoading(true);
        try {
            const res = await cancelEvent(event.id);
            if (res?.success) {
                toast.success(res?.message || "Event cancelled successfully");
                onOpenChange(false);
                onCancelled?.();
            } else {
                toast.error(res?.message || "Failed to cancel event", {
                    style: { backgroundColor: "#ef4444", color: "white", border: "none" },
                });
            }
        } catch (err: any) {
            toast.error(err?.message || "Something went wrong!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="dark:bg-darkSecondaryBg dark:border-darkBorder">
                <AlertDialogHeader>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
                        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <AlertDialogTitle className="text-center text-headingTextColor dark:text-darkTextPrimary">
                        Cancel this event?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center text-subTextColor dark:text-darkTextSecondary">
                        This will cancel <span className="font-semibold">{event?.name}</span> for
                        all {attendeeCount} attendee{attendeeCount === 1 ? "" : "s"} and remove it from
                        their connected Google / Microsoft calendars. This cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center gap-2">
                    <AlertDialogCancel className="dark:bg-darkPrimaryBg dark:border-darkBorder">
                        Keep event
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {loading ? "Cancelling..." : "Cancel event"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default CancelEventDialog;
