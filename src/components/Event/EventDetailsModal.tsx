"use client";

import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import EditEventModal from "./EditEventModal";
import AddMembersModal from "./AddMembersModal";
import CancelEventDialog from "./CancelEventDialog";
import { useEffect, useMemo, useState } from "react";
import { refreshEvents } from "@/actions/calendarEvent/action";
import {
    ArrowLeft,
    Calendar as CalendarIcon,
    Clock,
    Copy,
    Check,
    StickyNote,
    Users,
    Trash2,
    UserPlus,
    Pencil,
    ExternalLink,
    Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatTZFullDate, formatTZTime } from "@/utils";
import { useLogInUserStore } from "@/store/logInUserStore";
import {
    EventGoogleSyncOverview,
    EventMicrosoftSyncOverview,
    EventSyncStatus,
    IEvent,
} from "@/types/type";
import {
    GoogleIcon,
    MicrosoftIcon,
    ProviderBadge,
    SyncStatusPill,
} from "./eventHelpers";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

type Mode = "view" | "edit" | "add-members";

const isLiveStatus = (s: EventSyncStatus | undefined) =>
    s === "pending" || s === "processing";

const GoogleSyncCard = ({ overview }: { overview: EventGoogleSyncOverview }) => {
    if (!overview?.enabled) return null;

    const { counts } = overview;
    const total = counts?.total_assigned ?? 0;
    const synced = counts?.synced ?? 0;

    return (
        <div className="rounded-xl border border-borderColor dark:border-darkBorder bg-white dark:bg-darkPrimaryBg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-borderColor dark:border-darkBorder bg-bgSecondary/50 dark:bg-darkSecondaryBg/50">
                <div className="flex items-center gap-2">
                    <GoogleIcon className="h-5 w-5" />
                    <div>
                        <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                            Google Calendar
                        </p>
                        <p className="text-[11px] text-subTextColor dark:text-darkTextSecondary">
                            {synced} of {total} attendee{total === 1 ? "" : "s"} synced
                        </p>
                    </div>
                </div>
                {overview.organizer && (
                    <SyncStatusPill status={overview.organizer.status} />
                )}
            </div>

            {overview.members?.length > 0 && (
                <div className="divide-y divide-borderColor dark:divide-darkBorder">
                    {overview.members.map((m) => (
                        <div
                            key={m.user_id}
                            className="flex items-center justify-between gap-3 px-4 py-2.5"
                        >
                            <div className="flex items-center gap-2.5 min-w-0">
                                <Avatar className="h-7 w-7 shrink-0">
                                    <AvatarImage src={m.image || ""} />
                                    <AvatarFallback className="text-[10px]">
                                        {m.name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-xs font-medium text-headingTextColor dark:text-darkTextPrimary truncate">
                                            {m.name}
                                        </p>
                                        {m.is_organizer && (
                                            <span className="text-[9px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1 py-px rounded">
                                                Organizer
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-subTextColor dark:text-darkTextSecondary truncate">
                                        {m.email}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {m.last_error ? (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span>
                                                    <SyncStatusPill status={m.status} />
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-xs dark:bg-darkPrimaryBg">
                                                <p className="text-xs">{m.last_error}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                ) : (
                                    <SyncStatusPill status={m.status} />
                                )}
                                {m.calendar_link && (
                                    <a
                                        href={m.calendar_link}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary hover:underline"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const MicrosoftSyncCard = ({
    overview,
}: {
    overview: EventMicrosoftSyncOverview;
}) => {
    if (!overview?.enabled) return null;

    return (
        <div className="rounded-xl border border-borderColor dark:border-darkBorder bg-white dark:bg-darkPrimaryBg p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <MicrosoftIcon className="h-5 w-5" />
                    <div>
                        <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                            Microsoft 365
                        </p>
                        <p className="text-[11px] text-subTextColor dark:text-darkTextSecondary">
                            Organization-level calendar sync
                        </p>
                    </div>
                </div>
                <SyncStatusPill status={overview.status} />
            </div>
            {overview.last_error && (
                <p className="mt-2 text-[11px] text-red-600 dark:text-red-400">
                    {overview.last_error}
                </p>
            )}
            {overview.calendar_link && (
                <a
                    href={overview.calendar_link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                    Open in Outlook <ExternalLink className="h-3 w-3" />
                </a>
            )}
        </div>
    );
};

const isEventLive = (e: IEvent | null | undefined): boolean => {
    if (!e) return false;
    const g = e.sync_overview?.google;
    const m = e.sync_overview?.microsoft;
    if (g?.enabled) {
        if (g.organizer && isLiveStatus(g.organizer.status)) return true;
        if (g.members?.some((mem) => isLiveStatus(mem.status))) return true;
    }
    if (m?.enabled && isLiveStatus(m.status)) return true;
    if (e.meeting_provider && !e.meeting_link) return true;
    return false;
};

const EventDetailsModal = ({
    handleCloseDialog,
    event: initialEvent,
}: {
    handleCloseDialog: () => void;
    event: IEvent;
}) => {
    const logInUserData = useLogInUserStore((state) => state.logInUserData);
    const role = logInUserData?.role;
    const canEdit =
        role === "admin" ||
        role === "manager" ||
        role === "hr" ||
        role === "project_manager";
    const canDelete = role === "admin" || role === "manager" || role === "hr";

    const [event, setEvent] = useState<IEvent>(initialEvent);
    const [mode, setMode] = useState<Mode>("view");
    const [copied, setCopied] = useState(false);
    const [confirmCancel, setConfirmCancel] = useState(false);

    const isPastEvent = useMemo(() => {
        if (!event?.end_time) return false;
        return new Date(event.end_time).getTime() < Date.now();
    }, [event?.end_time]);

    const hasLiveSync = useMemo(() => isEventLive(event), [event]);

    useEffect(() => {
        if (!isEventLive(initialEvent)) return;

        let cancelled = false;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let attempts = 0;
        const MAX_ATTEMPTS = 30;
        const POLL_MS = 3000;

        const startDate = new Date(initialEvent.start_time);
        const query = {
            year: startDate.getUTCFullYear(),
            month: startDate.getUTCMonth() + 1,
        };

        const tick = async () => {
            if (cancelled || attempts++ >= MAX_ATTEMPTS) return;
            try {
                const res = await refreshEvents(query);
                const list = (res?.data ?? []) as IEvent[];
                const found = list.find((e) => e.id === initialEvent.id);
                if (found && !cancelled) {
                    setEvent(found);
                    if (!isEventLive(found)) return;
                }
            } catch {
                // ignore — keep polling until settled or timeout
            }
            if (!cancelled) timer = setTimeout(tick, POLL_MS);
        };

        timer = setTimeout(tick, POLL_MS);

        return () => {
            cancelled = true;
            if (timer) clearTimeout(timer);
        };
    }, [initialEvent]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Link copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    const isAllMembers = useMemo(() => {
        return Array.isArray(event?.sync_targets) && event?.eventAssigns?.length > 8;
    }, [event]);

    return (
        <DialogContent
            onInteractOutside={(e) => e.preventDefault()}
            className="w-full sm:max-w-150 max-h-[92vh] overflow-y-auto p-0 gap-0 border-borderColor dark:border-darkBorder"
        >
            <DialogHeader className="px-6 pt-5 pb-4 border-b border-borderColor dark:border-darkBorder">
                <div className="flex items-center justify-between gap-3">
                    {mode !== "view" ? (
                        <Button
                            variant="secondary"
                            size="sm"
                            className="dark:bg-darkPrimaryBg dark:border dark:border-darkBorder"
                            onClick={() => setMode("view")}
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back
                        </Button>
                    ) : (
                        <DialogTitle className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
                            Event details
                        </DialogTitle>
                    )}
                    {mode === "view" && <ProviderBadge provider={event?.meeting_provider} />}
                </div>
            </DialogHeader>

            <div className="px-6 py-5">
                {mode === "edit" && (
                    <EditEventModal
                        handleCloseDialog={handleCloseDialog}
                        event={event}
                    />
                )}

                {mode === "add-members" && (
                    <AddMembersModal
                        handleCloseDialog={handleCloseDialog}
                        event={event}
                    />
                )}

                {mode === "view" && (
                    <div className="space-y-5">
                        <div>
                            <h2 className="text-xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                {event?.name}
                            </h2>
                            <div className="mt-3 grid grid-cols-1 gap-2.5">
                                <div className="flex items-center gap-3 text-sm text-subTextColor dark:text-darkTextSecondary">
                                    <div className="w-8 h-8 rounded-full bg-bgSecondary dark:bg-darkPrimaryBg flex items-center justify-center shrink-0 border border-borderColor dark:border-darkBorder">
                                        <CalendarIcon className="w-4 h-4" />
                                    </div>
                                    <span>{formatTZFullDate(event?.start_time)}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-subTextColor dark:text-darkTextSecondary">
                                    <div className="w-8 h-8 rounded-full bg-bgSecondary dark:bg-darkPrimaryBg flex items-center justify-center shrink-0 border border-borderColor dark:border-darkBorder">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <span>
                                        {formatTZTime(event?.start_time)} — {formatTZTime(event?.end_time)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-subTextColor dark:text-darkTextSecondary">
                                Conference link
                            </label>
                            {event?.meeting_link ? (
                                <div className="flex items-center justify-between gap-2 rounded-lg border border-borderColor dark:border-darkBorder bg-bgSecondary/50 dark:bg-darkPrimaryBg/40 p-2 pl-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {event.meeting_provider === "google_meet" ? (
                                            <GoogleIcon className="h-4 w-4 shrink-0" />
                                        ) : event.meeting_provider === "microsoft_teams" ? (
                                            <MicrosoftIcon className="h-4 w-4 shrink-0" />
                                        ) : null}
                                        <a
                                            href={event.meeting_link}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-primary hover:underline truncate"
                                        >
                                            {event.meeting_link}
                                        </a>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 shrink-0"
                                        onClick={() => handleCopy(event.meeting_link!)}
                                    >
                                        {copied ? (
                                            <Check className="w-4 h-4 text-emerald-500" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-subTextColor" />
                                        )}
                                    </Button>
                                </div>
                            ) : hasLiveSync ? (
                                <div className="flex items-center gap-2 rounded-lg border border-dashed border-borderColor dark:border-darkBorder p-3 text-xs text-subTextColor dark:text-darkTextSecondary">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    Generating meeting link…
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed border-borderColor dark:border-darkBorder p-3 text-xs text-subTextColor dark:text-darkTextSecondary">
                                    No conference link for this event.
                                </div>
                            )}
                        </div>

                        {(event?.sync_overview?.google?.enabled ||
                            event?.sync_overview?.microsoft?.enabled) && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-subTextColor dark:text-darkTextSecondary">
                                        Calendar sync
                                    </label>
                                    <div className="space-y-2">
                                        <GoogleSyncCard overview={event.sync_overview.google} />
                                        <MicrosoftSyncCard overview={event.sync_overview.microsoft} />
                                    </div>
                                </div>
                            )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-subTextColor dark:text-darkTextSecondary flex items-center gap-2">
                                <Users className="w-3 h-3" />
                                Attendees
                                <span className="text-subTextColor/70 dark:text-darkTextSecondary/70">
                                    ({event?.eventAssigns?.length ?? 0})
                                </span>
                            </label>
                            {isAllMembers && (
                                <p className="text-[11px] text-subTextColor dark:text-darkTextSecondary">
                                    All company members ({event.eventAssigns.length})
                                </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                                {event?.eventAssigns?.map((assign, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 px-2 py-1 rounded-full border border-borderColor dark:border-darkBorder bg-white dark:bg-darkPrimaryBg"
                                    >
                                        <Avatar className="w-5 h-5">
                                            <AvatarImage src={assign.user?.image || ""} />
                                            <AvatarFallback className="text-[8px]">
                                                {assign.user?.name?.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-medium pr-1 text-headingTextColor dark:text-darkTextPrimary">
                                            {assign.user?.name}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-subTextColor dark:text-darkTextSecondary flex items-center gap-2">
                                <StickyNote className="w-3 h-3" /> Description
                            </label>
                            <div className="text-sm leading-relaxed text-subTextColor dark:text-darkTextSecondary bg-bgSecondary/60 dark:bg-darkPrimaryBg/40 p-3 rounded-lg border border-borderColor dark:border-darkBorder">
                                {event?.note || "No description provided."}
                            </div>
                        </div>

                        <div className="pt-3 border-t border-borderColor dark:border-darkBorder flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage src={event?.createdBy?.image || ""} />
                                    <AvatarFallback className="text-[12px] bg-primary text-white">
                                        {event?.createdBy?.name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="text-[11px] leading-none text-subTextColor dark:text-darkTextSecondary">
                                        Organized by
                                    </span>
                                    <span className="text-[13px] font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                        {event?.createdBy?.name}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {(canEdit || canDelete) && !isPastEvent && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {canEdit && (
                                    <>
                                        <Button
                                            variant="outline2"
                                            size="sm"
                                            onClick={() => setMode("edit")}
                                            className="dark:text-darkTextPrimary"
                                        >
                                            <Pencil className="h-3.5 w-3.5" /> Reschedule
                                        </Button>
                                        <Button
                                            variant="outline2"
                                            size="sm"
                                            onClick={() => setMode("add-members")}
                                            className="dark:text-darkTextPrimary"
                                        >
                                            <UserPlus className="h-3.5 w-3.5" /> Add members
                                        </Button>
                                    </>
                                )}
                                {canDelete && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="ml-auto"
                                        onClick={() => setConfirmCancel(true)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" /> Cancel event
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <CancelEventDialog
                open={confirmCancel}
                onOpenChange={setConfirmCancel}
                event={event}
                onCancelled={handleCloseDialog}
            />
        </DialogContent>
    );
};

export default EventDetailsModal;
