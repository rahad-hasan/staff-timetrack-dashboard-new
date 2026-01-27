/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "../ui/button";
import EditEventModal from "./EditEventModal";
import { useState } from "react";
import { ArrowLeft, Calendar, Clock, Link, Copy, Check, StickyNote, Users } from "lucide-react";
import EditIcon from "../Icons/FilterOptionIcon/EditIcon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatTZFullDate, formatTZTime } from "@/utils";
import { useLogInUserStore } from "@/store/logInUserStore";

const EventDetailsModal = ({ handleCloseDialog, event }: any) => {
    const logInUserData = useLogInUserStore(state => state.logInUserData);
    const isAuthorizeForEdit = (logInUserData?.role === 'admin' ||
        logInUserData?.role === 'manager' ||
        logInUserData?.role === 'hr');

    const [enableEdit, setEnableEdit] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <DialogContent
            onInteractOutside={(e) => e.preventDefault()}
            className="w-full sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl"
        >
            <DialogHeader className="">
                {
                    isAuthorizeForEdit ?
                        <div className="flex items-center justify-between -mt-3 p-6 pb-3 border-b dark:border-darkBorder">
                            <DialogTitle className="text-xl font-bold text-headingTextColor dark:text-darkTextPrimary">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className=" dark:bg-darkSecondaryBg"
                                    onClick={() => setEnableEdit(!enableEdit)}
                                >
                                    {enableEdit ? (
                                        <><ArrowLeft className="w-3.5 h-3.5" /> Back</>
                                    ) : (
                                        <><EditIcon size={12} /> Edit</>
                                    )}
                                </Button>
                            </DialogTitle>
                        </div>
                        :
                        <div className="flex items-center justify-between -mt-3 p-6 pb-3 border-b dark:border-darkBorder">
                            <DialogTitle className="text-xl text-headingTextColor dark:text-darkTextPrimary">
                                    <h2 className="">Event Details</h2>
                            </DialogTitle>
                        </div>
                }

            </DialogHeader>

            <div className="px-6 pb-6 pt-4">
                {enableEdit ? (
                    <EditEventModal
                        handleCloseDialog={handleCloseDialog}
                        event={event}
                    />
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                {event?.name}
                            </h2>

                            <div className="grid grid-cols-1 gap-3">
                                <div className="flex items-center gap-3 text-sm text-subTextColor dark:text-darkTextSecondary">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-darkBorder flex items-center justify-center shrink-0">
                                        <Calendar className="w-4 h-4 dark:text-darkTextSecondary" />
                                    </div>
                                    <span>{formatTZFullDate(event?.start_time)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-subTextColor dark:text-darkTextSecondary">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-darkBorder flex items-center justify-center shrink-0">
                                        <Clock className="w-4 h-4 dark:text-darkTextSecondary" />
                                    </div>
                                    <span>{formatTZTime(event?.start_time)} — {formatTZTime(event?.end_time)}</span>
                                </div>
                            </div>
                        </div>

                        {event?.meeting_link && (
                            <div className="space-y-2 w-full">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-subTextColor dark:text-darkTextSecondary">Meeting Link</label>
                                <div className="flex items-center gap-2 p-2 pl-3 rounded-lg border border-borderColor dark:border-darkBorder bg-gray-50/50 dark:bg-transparent">
                                    <Link className="w-4 h-4 text-primary shrink-0" />
                                    {event.meeting_link.length > 46
                                        ? `${event.meeting_link.substring(0, 46)}...`
                                        : event.meeting_link
                                    }
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0"
                                        onClick={() => handleCopy(event.meeting_link)}
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-subTextColor" />}
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-subTextColor dark:text-darkTextSecondary flex items-center gap-2">
                                <Users className="w-3 h-3 " /> Team Members
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {event?.eventAssigns?.map((assign: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-2 px-2 py-1.5 rounded-full border border-borderColor dark:border-darkBorder bg-white dark:bg-darkPrimaryBg">
                                        <Avatar className="w-5 h-5">
                                            <AvatarImage src={assign.user?.image} />
                                            <AvatarFallback className="text-[8px]">{assign.user?.name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-medium pr-1">{assign.user?.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-subTextColor dark:text-darkTextSecondary flex items-center gap-2">
                                <StickyNote className="w-3 h-3" /> Description
                            </label>
                            <div className="text-sm leading-relaxed text-subTextColor dark:text-darkTextSecondary bg-gray-50 dark:bg-darkBorder/20 p-4 rounded-xl border border-borderColor dark:border-darkBorder">
                                {event?.note || "No description provided."}
                            </div>
                        </div>

                        <div className="pt-4 mt-2 border-t dark:border-darkBorder flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={event?.createdBy?.image} />
                                    <AvatarFallback className="text-[12px] bg-primary text-white">{event?.createdBy?.name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-[12px] leading-none text-subTextColor dark:text-darkTextSecondary">Organized by</span>
                                    <span className="text-[14px] font-bold dark:text-darkTextPrimary">{event?.createdBy?.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DialogContent>
    );
};

export default EventDetailsModal;