"use client";

import {
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import EditEventModal from "./EditEventModal";
import { refreshEvents } from "@/actions/calendarEvent/action";
import {
    AlertCircle,
    ArrowLeft,
    CalendarClock,
    Check,
    CheckCircle2,
    Clock,
    Copy,
    ExternalLink,
    Link2,
    Link2Off,
    Loader2,
    Search,
    UserPlus,
    Users,
    X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { formatTZFullDate, formatTZTime } from "@/utils";
import { useLogInUserStore } from "@/store/logInUserStore";
import {
    EventMemberSyncOverview,
    EventSyncStatus,
    IEvent,
} from "@/types/type";
import {
    ProviderBadge,
} from "./eventHelpers";
import { RichTextViewer } from "@/components/Common/RichTextEditor";
import { cn } from "@/lib/utils";
import AddMembersModal from "./AddMembersModal";
import CancelEventDialog from "./CancelEventDialog";
import googleMeetIcon from "../../assets/events/google_meet.svg";
import microsoftTeamsIcon from "../../assets/events/microsoft-teams.svg";
import Image from "next/image";
import AttendeeRow from "./EventDetailsModalComponent/AttendeeRow";
import AttendeeStatBlock from "./EventDetailsModalComponent/AttendeeStatBlock";
import MicrosoftSyncCard from "./EventDetailsModalComponent/MicrosoftSyncCard";
import GoogleSyncCard from "./EventDetailsModalComponent/GoogleSyncCard";
import SectionCard from "./EventDetailsModalComponent/SectionCard";
import EventMetricCard from "./EventDetailsModalComponent/EventMetricCard";
import CalendarIcon from "../Icons/CalendarIcon";
import TeamsIcon from "../Icons/TeamsIcon";
import EditIcon from "../Icons/FilterOptionIcon/EditIcon";
import DeleteIcon from "../Icons/DeleteIcon";

type Mode = "view" | "edit" | "add-members";

const isLiveStatus = (status: EventSyncStatus | undefined) =>
    status === "pending" || status === "processing";

const formatDuration = (start?: string, end?: string) => {
    if (!start || !end) return "0m";
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const totalMinutes = Math.max(0, Math.round(diffMs / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours && minutes) return `${hours}h ${minutes}m`;
    if (hours) return `${hours}h`;
    return `${minutes}m`;
};

const getEventTimingMeta = (event: IEvent | null | undefined) => {
    if (!event) {
        return {
            label: "Draft",
            className:
                "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300",
        };
    }

    const now = Date.now();
    const start = new Date(event.start_time).getTime();
    const end = new Date(event.end_time).getTime();

    if (now > end) {
        return {
            label: "Completed",
            className:
                "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300",
        };
    }

    if (now >= start && now <= end) {
        return {
            label: "Live now",
            className:
                "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300",
        };
    }

    return {
        label: "Upcoming",
        className:
            "border-primary/20 bg-primary/8 text-primary dark:border-primary/30 dark:bg-primary/10",
    };
};


const isEventLive = (event: IEvent | null | undefined): boolean => {
    if (!event) return false;
    const google = event.sync_overview?.google;
    const microsoft = event.sync_overview?.microsoft;

    if (google?.enabled) {
        if (google.organizer && isLiveStatus(google.organizer.status)) return true;
        if (google.members?.some((member) => isLiveStatus(member.status))) return true;
    }

    if (microsoft?.enabled) {
        if (isLiveStatus(microsoft.status)) return true;
        if (microsoft.organizer && isLiveStatus(microsoft.organizer.status))
            return true;
        if (microsoft.members?.some((member) => isLiveStatus(member.status)))
            return true;
    }
    if (event.meeting_provider && !event.meeting_link) return true;
    return false;
};


type AttendeeFilter = "all" | "synced" | "pending" | "pending_connection" | "failed";

const ATTENDEE_FILTERS: {
    key: AttendeeFilter;
    label: string;
    matches: (status: EventSyncStatus) => boolean;
}[] = [
    { key: "all", label: "All", matches: () => true },
    {
        key: "synced",
        label: "Synced",
        matches: (s) => s === "synced",
    },
    {
        key: "pending",
        label: "Pending",
        matches: (s) => s === "pending" || s === "processing",
    },
    {
        key: "pending_connection",
        label: "Not connected",
        matches: (s) => s === "pending_connection" || s === "not_requested",
    },
    {
        key: "failed",
        label: "Failed",
        matches: (s) => s === "failed",
    },
];


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
    const [syncDrawerOpen, setSyncDrawerOpen] = useState(false);
    const [attendeeSearch, setAttendeeSearch] = useState("");
    const [attendeeFilter, setAttendeeFilter] = useState<AttendeeFilter>("all");

    useEffect(() => {
        setEvent(initialEvent);
        setMode("view");
        setCopied(false);
        setConfirmCancel(false);
        setSyncDrawerOpen(false);
        setAttendeeSearch("");
        setAttendeeFilter("all");
    }, [initialEvent]);

    useEffect(() => {
        if (!syncDrawerOpen) {
            setAttendeeSearch("");
            setAttendeeFilter("all");
        }
    }, [syncDrawerOpen]);

    const isPastEvent = useMemo(() => {
        if (!event?.end_time) return false;
        return new Date(event.end_time).getTime() < Date.now();
    }, [event?.end_time]);

    const hasLiveSync = useMemo(() => isEventLive(event), [event]);
    const timingMeta = useMemo(() => getEventTimingMeta(event), [event]);
    const attendeeCount = event?.eventAssigns?.length ?? 0;
    const resolvedMeetingLink =
        event?.meeting_link ?? event?.sync_overview?.microsoft?.meeting_link ?? null;

    const googleSync = event?.sync_overview?.google;
    const allMembers = useMemo<EventMemberSyncOverview[]>(
        () => googleSync?.members ?? [],
        [googleSync?.members],
    );

    const counts = googleSync?.counts;
    const totalAssigned = counts?.total_assigned ?? allMembers.length;
    const syncedCount = counts?.synced ?? 0;
    const pendingCount = (counts?.pending ?? 0) + (counts?.processing ?? 0);
    const notConnectedCount = counts?.pending_connection ?? 0;
    const failedCount = counts?.failed ?? 0;
    const progressPct =
        totalAssigned > 0
            ? Math.min(100, Math.round((syncedCount / totalAssigned) * 100))
            : 0;

    const filteredMembers = useMemo(() => {
        const search = attendeeSearch.trim().toLowerCase();
        const matcher =
            ATTENDEE_FILTERS.find((f) => f.key === attendeeFilter)?.matches ??
            (() => true);
        return allMembers.filter((m) => {
            if (!matcher(m.status)) return false;
            if (!search) return true;
            return (
                m.name?.toLowerCase().includes(search) ||
                m.email?.toLowerCase().includes(search)
            );
        });
    }, [allMembers, attendeeFilter, attendeeSearch]);

    const filterCounts: Record<AttendeeFilter, number> = useMemo(
        () => ({
            all: allMembers.length,
            synced: allMembers.filter((m) => m.status === "synced").length,
            pending: allMembers.filter(
                (m) => m.status === "pending" || m.status === "processing",
            ).length,
            pending_connection: allMembers.filter(
                (m) =>
                    m.status === "pending_connection" || m.status === "not_requested",
            ).length,
            failed: allMembers.filter((m) => m.status === "failed").length,
        }),
        [allMembers],
    );

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
                const found = list.find((item) => item.id === initialEvent.id);
                if (found && !cancelled) {
                    setEvent(found);
                    if (!isEventLive(found)) return;
                }
            } catch {
                // ignore and keep polling until the sync settles
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

    return (
        <SheetContent
            side="right"
            className="w-full overflow-y-auto border-borderColor px-0 dark:border-darkBorder dark:bg-darkSecondaryBg sm:max-w-[720px]"
        >
            <SheetHeader className="border-b border-borderColor px-6 pb-5 dark:border-darkBorder">
                <div className="pr-10">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <SheetTitle className="text-xl text-headingTextColor dark:text-darkTextPrimary">
                                {mode === "view"
                                    ? "Event details"
                                    : mode === "edit"
                                      ? "Reschedule event"
                                      : "Add members"}
                            </SheetTitle>
                            <SheetDescription className="mt-1">
                                {mode === "view"
                                    ? "Review the event schedule, attendees, sync status, and meeting links from this side drawer."
                                    : mode === "edit"
                                      ? "Adjust the date or time range for this event without leaving the calendar view."
                                      : "Invite more team members and trigger the related notification and sync flow."}
                            </SheetDescription>
                        </div>

                        {mode === "view" ? (
                            <ProviderBadge provider={event?.meeting_provider} />
                        ) : (
                            <Button
                                variant="outline2"
                                size="sm"
                                className="shrink-0 dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                                onClick={() => setMode("view")}
                            >
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Back
                            </Button>
                        )}
                    </div>
                </div>
            </SheetHeader>

            <div className="space-y-5 px-6 py-5">
                <div className="relative overflow-hidden rounded-lg border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkPrimaryBg">
                    <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-r from-primary/12 via-cyan-500/8 to-transparent dark:from-primary/15 dark:via-cyan-500/10 dark:to-transparent" />

                    <div className="relative">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={cn(
                                            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                                            timingMeta.className,
                                        )}
                                    >
                                        {timingMeta.label}
                                    </span>
                                    {hasLiveSync && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                            Sync updating
                                        </span>
                                    )}
                                </div>

                                <h2 className="mt-4 text-2xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                    {event?.name}
                                </h2>
                                <p className="mt-8 max-w-2xl text-sm leading-6 text-subTextColor dark:text-darkTextSecondary">
                                    Scheduled for {formatTZFullDate(event?.start_time)} from{" "}
                                    {formatTZTime(event?.start_time)} to{" "}
                                    {formatTZTime(event?.end_time)}.
                                </p>
                            </div>

                            <div className="flex items-center gap-3 rounded-md border border-borderColor bg-white/85 px-3 py-2 dark:border-darkBorder dark:bg-darkSecondaryBg/80">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={event?.createdBy?.image || ""} />
                                    <AvatarFallback className="bg-primary text-white">
                                        {event?.createdBy?.name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                                        Organizer
                                    </p>
                                    <p className="truncate text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                        {event?.createdBy?.name}
                                    </p>
                                    <p className="truncate text-[11px] text-subTextColor dark:text-darkTextSecondary">
                                        {event?.createdBy?.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {mode === "view" ? (
                    <>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                            <EventMetricCard
                                icon={<CalendarIcon size={16} />}
                                label="Date"
                                value={formatTZFullDate(event?.start_time)}
                            />
                            <EventMetricCard
                                icon={<Clock className="h-4 w-4" />}
                                label="Time"
                                value={`${formatTZTime(event?.start_time)} - ${formatTZTime(
                                    event?.end_time,
                                )}`}
                            />
                            <EventMetricCard
                                icon={<CalendarClock className="h-4 w-4" />}
                                label="Duration"
                                value={formatDuration(event?.start_time, event?.end_time)}
                            />
                            <EventMetricCard
                                icon={<TeamsIcon size={16} />}
                                label="Attendees"
                                value={attendeeCount}
                                helper={attendeeCount === 1 ? "1 invite" : "Total invites"}
                            />
                        </div>

                        {(canEdit || canDelete) && !isPastEvent && (
                            <SectionCard
                                title="Event actions"
                                description="Reschedule the session, invite more members, or cancel the event from here."
                            >
                                <div className="flex flex-wrap gap-2">
                                    {canEdit && (
                                        <>
                                            <Button
                                                variant="outline2"
                                                size="sm"
                                                onClick={() => setMode("edit")}
                                                className="dark:bg-darkSecondaryBg dark:text-darkTextPrimary"
                                            >
                                                <EditIcon size={16} />
                                                Reschedule
                                            </Button>
                                            <Button
                                                variant="outline2"
                                                size="sm"
                                                onClick={() => setMode("add-members")}
                                                className="dark:bg-darkSecondaryBg dark:text-darkTextPrimary"
                                            >
                                                <UserPlus className="h-4 w-4" />
                                                Add members
                                            </Button>
                                        </>
                                    )}
                                    {canDelete && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="sm:ml-auto"
                                            onClick={() => setConfirmCancel(true)}
                                        >
                                            <DeleteIcon size={20}/>
                                            Cancel event
                                        </Button>
                                    )}
                                </div>
                            </SectionCard>
                        )}

                        <SectionCard
                            title="Conference link"
                            description="Share or open the meeting room attached to this event."
                        >
                            {resolvedMeetingLink ? (
                                <div className="rounded-lg border border-borderColor bg-bgSecondary/55 p-3 dark:border-darkBorder dark:bg-darkSecondaryBg">
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white dark:bg-darkPrimaryBg">
                                                {event.meeting_provider === "google_meet" ? (
                                                    <Image src={googleMeetIcon} width={50} height={50} className="w-5" alt="" />
                                                ) : event.meeting_provider ===
                                                  "microsoft_teams" ? (
                                                    <Image src={microsoftTeamsIcon} width={50} height={50} className="w-5" alt="" />
                                                ) : (
                                                    <Link2 className="h-4 w-4 text-primary" />
                                                )}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-xs uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                                                    Meeting room
                                                </p>
                                                <a
                                                    href={resolvedMeetingLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-1 block truncate text-sm font-medium text-primary hover:underline"
                                                >
                                                    {resolvedMeetingLink}
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline2"
                                                size="sm"
                                                className="dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                                                asChild
                                            >
                                                <a
                                                    href={resolvedMeetingLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Open
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                </a>
                                            </Button>
                                            <Button
                                                variant="outline2"
                                                size="sm"
                                                className="dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                                                onClick={() => handleCopy(resolvedMeetingLink)}
                                            >
                                                {copied ? (
                                                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                                                ) : (
                                                    <Copy className="h-3.5 w-3.5" />
                                                )}
                                                {copied ? "Copied" : "Copy"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : hasLiveSync ? (
                                <div className="flex items-center gap-3 rounded-lg border border-dashed border-borderColor px-4 py-4 text-sm text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary">
                                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    Generating the meeting link and syncing it to connected
                                    calendars.
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed border-borderColor px-4 py-4 text-sm text-subTextColor dark:border-darkBorder dark:text-darkTextSecondary">
                                    No conference link is attached to this event.
                                </div>
                            )}
                        </SectionCard>

                        {(event?.sync_overview?.google?.enabled ||
                            event?.sync_overview?.microsoft?.enabled) && (
                            <SectionCard
                                title="Attendees"
                                description="Everyone invited to this event and whether their calendar invite has landed."
                                action={
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold text-primary">
                                        <Users className="h-3 w-3" />
                                        {attendeeCount} invited
                                    </span>
                                }
                            >
                                <div className="space-y-3">
                                    <GoogleSyncCard
                                        overview={event.sync_overview.google}
                                        limit={4}
                                        onViewAll={() => setSyncDrawerOpen(true)}
                                    />
                                    <MicrosoftSyncCard overview={event.sync_overview.microsoft} />
                                </div>
                            </SectionCard>
                        )}

                        <SectionCard
                            title="Description"
                            description="Agenda, meeting context, and notes added during event creation."
                        >
                            <div className="rounded-lg border border-borderColor bg-bgSecondary/45 p-4 dark:border-darkBorder dark:bg-darkSecondaryBg">
                                {event?.note ? (
                                    <RichTextViewer html={event.note} />
                                ) : (
                                    <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                                        No description was added for this event.
                                    </p>
                                )}
                            </div>
                        </SectionCard>
                    </>
                ) : (
                    <SectionCard
                        title={mode === "edit" ? "Update schedule" : "Invite more people"}
                        description={
                            mode === "edit"
                                ? "This keeps the existing attendees and only changes the event timing."
                                : "New attendees receive the event notification and follow-up sync jobs."
                        }
                    >
                        {mode === "edit" ? (
                            <EditEventModal
                                handleCloseDialog={handleCloseDialog}
                                event={event}
                            />
                        ) : (
                            <AddMembersModal
                                handleCloseDialog={handleCloseDialog}
                                event={event}
                            />
                        )}
                    </SectionCard>
                )}
            </div>

            <CancelEventDialog
                open={confirmCancel}
                onOpenChange={setConfirmCancel}
                event={event}
                onCancelled={handleCloseDialog}
            />

            <Dialog open={syncDrawerOpen} onOpenChange={setSyncDrawerOpen}>
                <DialogContent className="flex max-h-[88vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px]">
                    <DialogHeader className="shrink-0 border-b border-borderColor px-6 pb-5 pt-6 dark:border-darkBorder">
                        <div className="flex items-start gap-3 pr-8">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/15">
                                <Users className="h-4.5 w-4.5" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <DialogTitle className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                    All attendees
                                </DialogTitle>
                                <DialogDescription className="mt-1 text-xs">
                                    {attendeeCount}{" "}
                                    {attendeeCount === 1 ? "person" : "people"} invited to{" "}
                                    <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                                        {event?.name}
                                    </span>
                                </DialogDescription>
                            </div>
                        </div>

                        {googleSync?.enabled && totalAssigned > 0 && (
                            <div className="mt-4 rounded-lg border border-borderColor bg-bgSecondary/55 p-3 dark:border-darkBorder dark:bg-darkSecondaryBg/60">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                                            Invite delivery
                                        </p>
                                        <p className="mt-0.5 text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                            <span className="text-emerald-600 dark:text-emerald-400">
                                                {syncedCount}
                                            </span>
                                            <span className="text-subTextColor dark:text-darkTextSecondary">
                                                {" "}
                                                / {totalAssigned} delivered
                                            </span>
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                        {progressPct}%
                                    </span>
                                </div>
                                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-borderColor/60 dark:bg-darkBorder/60">
                                    <div
                                        className="h-full rounded-full bg-linear-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    <AttendeeStatBlock
                                        icon={<CheckCircle2 className="h-3 w-3" />}
                                        label="Synced"
                                        value={syncedCount}
                                        tone="emerald"
                                    />
                                    <AttendeeStatBlock
                                        icon={<Clock className="h-3 w-3" />}
                                        label="Pending"
                                        value={pendingCount}
                                        tone="blue"
                                    />
                                    <AttendeeStatBlock
                                        icon={<Link2Off className="h-3 w-3" />}
                                        label="Not connected"
                                        value={notConnectedCount}
                                        tone="amber"
                                    />
                                    <AttendeeStatBlock
                                        icon={<AlertCircle className="h-3 w-3" />}
                                        label="Failed"
                                        value={failedCount}
                                        tone={failedCount > 0 ? "red" : "slate"}
                                    />
                                </div>
                            </div>
                        )}
                    </DialogHeader>

                    <div className="shrink-0 border-b border-borderColor px-6 py-3 dark:border-darkBorder">
                        <div className="relative">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subTextColor dark:text-darkTextSecondary" />
                            <Input
                                value={attendeeSearch}
                                onChange={(e) => setAttendeeSearch(e.target.value)}
                                placeholder="Search by name or email"
                                className="h-9 pl-8 pr-8 text-xs"
                            />
                            {attendeeSearch && (
                                <button
                                    type="button"
                                    onClick={() => setAttendeeSearch("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-subTextColor transition hover:bg-bgSecondary hover:text-headingTextColor dark:text-darkTextSecondary dark:hover:bg-darkSecondaryBg dark:hover:text-darkTextPrimary"
                                    aria-label="Clear search"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>

                        <div className="-mx-1 mt-3 flex gap-1 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {ATTENDEE_FILTERS.map((f) => {
                                const active = attendeeFilter === f.key;
                                const count = filterCounts[f.key];
                                return (
                                    <button
                                        key={f.key}
                                        type="button"
                                        onClick={() => setAttendeeFilter(f.key)}
                                        className={cn(
                                            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition",
                                            active
                                                ? "border-primary/30 bg-primary/10 text-primary"
                                                : "border-borderColor bg-white text-subTextColor hover:border-primary/20 hover:text-primary dark:border-darkBorder dark:bg-darkSecondaryBg/60 dark:text-darkTextSecondary",
                                        )}
                                    >
                                        {f.label}
                                        <span
                                            className={cn(
                                                "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                                                active
                                                    ? "bg-primary/15 text-primary"
                                                    : "bg-bgSecondary text-subTextColor dark:bg-darkPrimaryBg dark:text-darkTextSecondary",
                                            )}
                                        >
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto bg-bgSecondary/30 px-6 py-5 dark:bg-darkSecondaryBg/30">
                        {googleSync?.enabled && filteredMembers.length > 0 ? (
                            <div className="overflow-hidden rounded-lg border border-borderColor bg-white dark:border-darkBorder dark:bg-darkPrimaryBg">
                                <div className="flex items-center justify-between border-b border-borderColor bg-bgSecondary/40 px-4 py-2 dark:border-darkBorder dark:bg-darkSecondaryBg/50">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                                        Showing {filteredMembers.length} of{" "}
                                        {allMembers.length}
                                    </p>
                                    {(attendeeSearch || attendeeFilter !== "all") && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAttendeeSearch("");
                                                setAttendeeFilter("all");
                                            }}
                                            className="text-[11px] font-medium text-primary hover:underline"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                                <div className="divide-y divide-borderColor dark:divide-darkBorder">
                                    {filteredMembers.map((member) => (
                                        <AttendeeRow
                                            key={`dialog-${member.user_id}`}
                                            member={member}
                                            organizerId={
                                                googleSync?.organizer?.user_id ?? null
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        ) : googleSync?.enabled ? (
                            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-borderColor bg-white px-6 py-12 text-center dark:border-darkBorder dark:bg-darkPrimaryBg">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bgSecondary text-subTextColor dark:bg-darkSecondaryBg dark:text-darkTextSecondary">
                                    <Search className="h-4 w-4" />
                                </span>
                                <p className="mt-3 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                                    No attendees match
                                </p>
                                <p className="mt-1 text-xs text-subTextColor dark:text-darkTextSecondary">
                                    Try a different search or filter.
                                </p>
                                <Button
                                    variant="outline2"
                                    size="sm"
                                    className="mt-4 dark:bg-darkSecondaryBg dark:text-darkTextPrimary"
                                    onClick={() => {
                                        setAttendeeSearch("");
                                        setAttendeeFilter("all");
                                    }}
                                >
                                    Clear filters
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed border-borderColor bg-white px-6 py-10 text-center text-sm text-subTextColor dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextSecondary">
                                No Google Calendar sync data available for this event.
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </SheetContent>
    );
};

export default EventDetailsModal;