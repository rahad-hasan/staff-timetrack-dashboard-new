/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "@/components/ui/button";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { addNewEventSchema } from "@/zod/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import {
    AlertTriangle,
    CalendarDays,
    CalendarPlus,
    ChevronDownIcon,
    FileText,
    Users as UsersIcon,
    Video,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { RichTextEditor } from "@/components/Common/RichTextEditor";
import {
    MultiSelect,
    MultiSelectContent,
    MultiSelectGroup,
    MultiSelectItem,
    MultiSelectTrigger,
    MultiSelectValue,
} from "@/components/ui/multi-select";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getMembersDashboard } from "@/actions/members/action";
import { addEvent } from "@/actions/calendarEvent/action";
import {
    getGoogleConnected,
    getMicrosoftConnected,
} from "@/actions/integrations/action";
import ClockIcon from "../Icons/ClockIcon";
import { cn } from "@/lib/utils";
import {
    GoogleIcon,
    MicrosoftIcon,
    isConflictResponse,
    parseConflictMessage,
} from "./eventHelpers";
import { useGoogleConnectFlow } from "../Integrations/useGoogleConnectFlow";
import { useMicrosoftConnectFlow } from "../Integrations/useMicrosoftConnectFlow";
import { Loader2 } from "lucide-react";

type FormInput = z.input<typeof addNewEventSchema>;
type FormValues = z.output<typeof addNewEventSchema>;

const buildIsoFromDateAndTime = (date: Date, time: string) => {
    const [h, m, s] = time.split(":").map((v) => Number(v) || 0);
    const dt = new Date(date);
    dt.setHours(h, m, s ?? 0, 0);
    return dt;
};

const formatDuration = (start: string, end: string) => {
    const [startHours = 0, startMinutes = 0] = start
        .split(":")
        .map((value) => Number(value) || 0);
    const [endHours = 0, endMinutes = 0] = end
        .split(":")
        .map((value) => Number(value) || 0);

    const totalStartMinutes = startHours * 60 + startMinutes;
    const totalEndMinutes = endHours * 60 + endMinutes;
    const diffMinutes = Math.max(0, totalEndMinutes - totalStartMinutes);
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    if (hours && minutes) return `${hours}h ${minutes}m`;
    if (hours) return `${hours}h`;
    return `${minutes}m`;
};

const AddEventModal = ({ onClose }: { onClose: () => void }) => {
    const [members, setMembers] = useState<
        { id: number | string; name: string; image?: string }[]
    >([]);
    const [loading, setLoading] = useState(false);
    const [openStartDate, setOpenStartDate] = useState(false);
    const [conflicts, setConflicts] = useState<string[]>([]);
    const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);
    const [microsoftConnected, setMicrosoftConnected] = useState<boolean | null>(
        null,
    );

    const form = useForm<FormInput, any, FormValues>({
        resolver: zodResolver(addNewEventSchema),
        defaultValues: {
            eventName: "",
            start_time: "09:00:00",
            end_time: "09:30:00",
            members: [],
            description: "",
            conference_provider: "google",
        },
    });

    const conferenceProvider = form.watch("conference_provider");
    const watchedMembers = form.watch("members");
    const startTime = form.watch("start_time");
    const endTime = form.watch("end_time");

    const refreshGoogleConnected = async () => {
        try {
            const res: any = await getGoogleConnected();
            const data = res?.data ?? res;
            setGoogleConnected(!!data?.connected);
        } catch {
            setGoogleConnected(false);
        }
    };

    const refreshMicrosoftConnected = async () => {
        try {
            const res: any = await getMicrosoftConnected();
            const data = res?.data ?? res;
            setMicrosoftConnected(!!data?.connected);
        } catch {
            setMicrosoftConnected(false);
        }
    };

    const { start: startGoogleConnect, busy: connectBusy } = useGoogleConnectFlow(
        () => refreshGoogleConnected(),
    );

    const {
        start: startMicrosoftConnect,
        busy: microsoftConnectBusy,
    } = useMicrosoftConnectFlow(() => refreshMicrosoftConnected());

    useEffect(() => {
        const loadMembers = async () => {
            try {
                const res = await getMembersDashboard();
                if (res?.success) {
                    const apiMembers = res.data;
                    setMembers([
                        { id: "all", name: "All members", image: "" },
                        ...apiMembers,
                    ]);
                }
            } catch (err) {
                console.error("Failed to fetch members", err);
            }
        };
        loadMembers();
    }, []);

    useEffect(() => {
        if (conferenceProvider === "google" && googleConnected === null) {
            refreshGoogleConnected();
        }
        if (conferenceProvider === "microsoft" && microsoftConnected === null) {
            refreshMicrosoftConnected();
        }
    }, [conferenceProvider, googleConnected, microsoftConnected]);

    const needsGoogleConnect =
        conferenceProvider === "google" && googleConnected === false;
    const needsMicrosoftConnect =
        conferenceProvider === "microsoft" && microsoftConnected === false;

    const attendeePreview = useMemo(() => {
        if (watchedMembers.includes("all")) {
            return "All members";
        }

        return watchedMembers.length === 0
            ? "No attendees"
            : watchedMembers.length === 1
              ? "1 person"
              : `${watchedMembers.length} people`;
    }, [watchedMembers]);

    const providerPreview =
        conferenceProvider === "google"
            ? "Google Meet"
            : conferenceProvider === "microsoft"
              ? "Teams"
              : "No conference";

    const submitWith = async (
        values: FormValues,
        force: boolean,
    ): Promise<{ ok: boolean; res: any }> => {
        const startDt = buildIsoFromDateAndTime(values.date, values.start_time);
        const endDt = buildIsoFromDateAndTime(values.date, values.end_time);

        const memberIds = values.members.includes("all")
            ? "all"
            : (values.members.map((v) => Number(v)) as number[]);

        const payload: Record<string, any> = {
            name: values.eventName,
            note: values.description,
            start_time: startDt.toISOString(),
            end_time: endDt.toISOString(),
            member_ids: memberIds,
            force_create: force,
        };

        if (values.conference_provider && values.conference_provider !== "none") {
            payload.conference_provider = values.conference_provider;
        }

        const res = await addEvent(payload);
        return { ok: !!res?.success, res };
    };

    async function onSubmit(values: FormValues) {
        setLoading(true);
        setConflicts([]);
        try {
            const { ok, res } = await submitWith(values, false);
            if (ok) {
                toast.success(res?.message || "Event created successfully");
                form.reset();
                setTimeout(() => onClose(), 0);
                return;
            }
            if (isConflictResponse(res)) {
                setConflicts(parseConflictMessage(res?.message));
                return;
            }
            toast.error(res?.message || "Failed to create event", {
                style: { backgroundColor: "#ef4444", color: "white", border: "none" },
            });
        } catch (error: any) {
            toast.error(error?.message || "Something went wrong!", {
                style: { backgroundColor: "#ef4444", color: "white", border: "none" },
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleScheduleAnyway() {
        const raw = form.getValues();
        const values: FormValues = {
            ...raw,
            conference_provider: raw.conference_provider ?? "none",
        };
        setLoading(true);
        try {
            const { ok, res } = await submitWith(values, true);
            if (ok) {
                toast.success(res?.message || "Event created successfully");
                form.reset();
                setConflicts([]);
                setTimeout(() => onClose(), 0);
                return;
            }
            toast.error(res?.message || "Failed to create event", {
                style: { backgroundColor: "#ef4444", color: "white", border: "none" },
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <DialogContent
            onInteractOutside={(event) => event.preventDefault()}
            className="modern-scrollbar w-full max-w-[calc(100vw-2rem)] sm:max-w-[760px] lg:max-w-[1120px] max-h-[95vh] overflow-y-auto gap-0 border-borderColor p-0 dark:border-darkBorder dark:bg-darkSecondaryBg"
        >
            <DialogHeader className="border-b border-borderColor bg-linear-to-r from-primary/12 via-cyan-500/6 to-transparent px-5 py-4 dark:border-darkBorder dark:from-primary/14 dark:via-cyan-500/8 dark:to-transparent sm:px-6">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/14 text-primary ring-1 ring-primary/15">
                        <CalendarPlus className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                        <DialogTitle className="text-base font-semibold leading-tight text-headingTextColor dark:text-darkTextPrimary sm:text-lg">
                            Create new event
                        </DialogTitle>
                        <DialogDescription className="mt-1 max-w-3xl text-xs leading-5 text-subTextColor dark:text-darkTextSecondary sm:text-[13px]">
                            Schedule a meeting with optional Meet or Teams link and attendee sync.
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4 px-5 py-5 sm:px-6"
                >
                    {conflicts.length > 0 && (
                        <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50/70 dark:bg-red-500/10 p-3 space-y-2">
                            <div className="flex items-center gap-2 text-red-700 dark:text-red-300 text-sm font-semibold">
                                <AlertTriangle className="h-4 w-4" />
                                Schedule conflicts detected
                            </div>
                            <ul className="text-[12px] leading-relaxed text-red-700 dark:text-red-300 space-y-1 list-disc pl-5">
                                {conflicts.map((c, i) => (
                                    <li key={i}>{c}</li>
                                ))}
                            </ul>
                            <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleScheduleAnyway}
                                    disabled={loading}
                                >
                                    Schedule anyway
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline2"
                                    onClick={() => setConflicts([])}
                                >
                                    Edit details
                                </Button>
                            </div>
                            <p className="text-[11px] text-red-700/70 dark:text-red-300/70">
                                This will not cancel the conflicting events.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
                        <div className="space-y-4 rounded-lg border border-white/8 bg-white/60 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur-md dark:border-white/6 dark:bg-darkPrimaryBg/40">
                            <div>
                                <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                    Schedule details
                                </p>
                                <p className="mt-1 text-xs leading-5 text-subTextColor dark:text-darkTextSecondary">
                                    Event name, date, timing, and attendees.
                                </p>
                            </div>
                            <FormField
                                control={form.control}
                                name="eventName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>Event name</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                className="h-10 dark:bg-darkSecondaryBg dark:border-darkBorder"
                                                placeholder="e.g. Sprint Planning"
                                                maxLength={30}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel required className="flex items-center gap-1.5">
                                            <CalendarDays className="h-3.5 w-3.5" /> Date
                                        </FormLabel>
                                        <FormControl>
                                            <Popover
                                                open={openStartDate}
                                                onOpenChange={setOpenStartDate}
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline2"
                                                        type="button"
                                                        className="h-10 w-full justify-between py-1.5 font-normal text-headingTextColor dark:bg-darkSecondaryBg dark:border-darkBorder dark:text-darkTextPrimary"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <CalendarDays className="h-4 w-4 text-subTextColor dark:text-darkTextSecondary" />
                                                            {field.value
                                                                ? field.value.toLocaleDateString(undefined, {
                                                                      weekday: "short",
                                                                      month: "short",
                                                                      day: "numeric",
                                                                      year: "numeric",
                                                                  })
                                                                : "Set a date"}
                                                        </div>
                                                        <ChevronDownIcon className="h-4 w-4 opacity-60" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto overflow-hidden p-0"
                                                    align="start"
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        captionLayout="dropdown"
                                                        disabled={(d) => {
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            return d < today;
                                                        }}
                                                        onSelect={(date) => {
                                                            field.onChange(date);
                                                            setOpenStartDate(false);
                                                        }}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={form.control}
                                    name="start_time"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>Start</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <ClockIcon
                                                            size={16}
                                                            className="text-headingTextColor dark:text-darkTextPrimary"
                                                        />
                                                    </div>
                                                    <Input
                                                        type="time"
                                                        step="1"
                                                        {...field}
                                                        className="peer h-10 appearance-none bg-background pl-9 dark:bg-darkSecondaryBg dark:border-darkBorder [&::-webkit-calendar-picker-indicator]:hidden"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="end_time"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel required>End</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <div className="text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                                        <ClockIcon
                                                            size={16}
                                                            className="text-headingTextColor dark:text-darkTextPrimary"
                                                        />
                                                    </div>
                                                    <Input
                                                        type="time"
                                                        step="1"
                                                        {...field}
                                                        className="peer h-10 appearance-none bg-background pl-9 dark:bg-darkSecondaryBg dark:border-darkBorder [&::-webkit-calendar-picker-indicator]:hidden"
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="members"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required className="flex items-center gap-1.5">
                                            <UsersIcon className="h-3.5 w-3.5" /> Attendees
                                        </FormLabel>
                                        <FormControl>
                                            <MultiSelect
                                                values={field.value.map(String)}
                                                onValuesChange={(vals) => {
                                                    const lastSelected = vals[vals.length - 1];
                                                    const processed: (string | number)[] =
                                                        lastSelected === "all"
                                                            ? ["all"]
                                                            : vals
                                                                  .filter((v) => v !== "all")
                                                                  .map((v) => Number(v));
                                                    field.onChange(processed);
                                                }}
                                            >
                                                <MultiSelectTrigger className="w-full min-h-10 py-1.5 hover:bg-white dark:bg-darkSecondaryBg hover:dark:bg-darkSecondaryBg dark:border-darkBorder">
                                                    <MultiSelectValue placeholder="Select attendees..." />
                                                </MultiSelectTrigger>
                                                <MultiSelectContent
                                                    onWheel={(e) => e.stopPropagation()}
                                                    className="dark:bg-darkSecondaryBg"
                                                >
                                                    <MultiSelectGroup className="dark:bg-darkSecondaryBg">
                                                        {members.map((member) => (
                                                            <MultiSelectItem
                                                                key={member.id}
                                                                value={String(member.id)}
                                                                className="px-0 cursor-pointer hover:dark:bg-darkPrimaryBg"
                                                            >
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarImage src={member.image || ""} />
                                                                    <AvatarFallback>
                                                                        {member.name.charAt(0)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <p>{member.name}</p>
                                                            </MultiSelectItem>
                                                        ))}
                                                    </MultiSelectGroup>
                                                </MultiSelectContent>
                                            </MultiSelect>
                                        </FormControl>
                                        <p className="text-xs leading-5 text-subTextColor dark:text-darkTextSecondary">
                                            Choose specific people or use <span className="font-semibold text-headingTextColor dark:text-darkTextPrimary">All members</span> for company-wide sessions.
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="conference_provider"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5">
                                            <Video className="h-3.5 w-3.5" />
                                            Conference provider
                                        </FormLabel>
                                        <div className="mt-2 grid grid-cols-3 gap-2">
                                            {[
                                                {
                                                    v: "none",
                                                    label: "None",
                                                    icon: null,
                                                },
                                                {
                                                    v: "google",
                                                    label: "Google Meet",
                                                    icon: <GoogleIcon className="h-4 w-4" />,
                                                },
                                                {
                                                    v: "microsoft",
                                                    label: "Teams",
                                                    icon: <MicrosoftIcon className="h-4 w-4" />,
                                                },
                                            ].map((opt) => {
                                                const active = field.value === opt.v;

                                                return (
                                                    <button
                                                        key={opt.v}
                                                        type="button"
                                                        onClick={() => field.onChange(opt.v)}
                                                        className={cn(
                                                            "group flex h-11 items-center justify-center gap-2 rounded-lg border px-3 text-[13px] font-medium transition-all cursor-pointer",
                                                            active
                                                                ? "border-primary bg-primary/10 text-primary ring-1 ring-primary/25 shadow-sm"
                                                                : "border-white/10 bg-white/40 text-subTextColor hover:border-primary/35 hover:bg-white/55 dark:border-white/6 dark:bg-darkPrimaryBg/35 dark:text-darkTextSecondary dark:hover:bg-darkPrimaryBg/55",
                                                        )}
                                                    >
                                                        {opt.icon ?? <Video className="h-4 w-4" />}
                                                        <span className="leading-none">{opt.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-dashed border-white/10 bg-white/30 px-3.5 py-2.5 backdrop-blur-sm dark:border-white/6 dark:bg-darkSecondaryBg/30">
                                <span className="inline-flex items-center text-[11px] font-semibold uppercase leading-none tracking-[0.14em] text-subTextColor dark:text-darkTextSecondary">
                                    Summary
                                </span>
                                <span className="inline-flex items-center text-sm font-semibold leading-none text-headingTextColor dark:text-darkTextPrimary">
                                    {attendeePreview} • {formatDuration(startTime, endTime)} • {providerPreview}
                                </span>
                            </div>
                        </div>

                        <div className="flex h-full min-h-0 flex-col space-y-3 rounded-lg border border-white/8 bg-white/60 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur-md dark:border-white/6 dark:bg-darkPrimaryBg/40">
                            <div>
                                <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                    Description
                                </p>
                                <p className="mt-1 text-xs leading-5 text-subTextColor dark:text-darkTextSecondary">
                                    Optional agenda or notes attendees will see.
                                </p>
                            </div>
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem className="!flex min-h-0 flex-1 flex-col">
                                        <FormLabel required className="flex items-center gap-1.5">
                                            <FileText className="h-3.5 w-3.5" /> Description
                                        </FormLabel>
                                        <FormControl>
                                            <RichTextEditor
                                                value={field.value || ""}
                                                onChange={field.onChange}
                                                placeholder="Add an agenda, talking points, or context..."
                                                className="h-full"
                                                minHeightClass="min-h-[220px] modern-scrollbar"
                                                fillHeight
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {needsGoogleConnect && (
                        <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-500/30 dark:bg-amber-500/10 sm:flex-row sm:items-center">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                                        Connect Google to host a Google Meet event
                                    </p>
                                    <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                                        Authorize StaffTime-Track to access your Google Calendar before scheduling.
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                onClick={startGoogleConnect}
                                disabled={connectBusy}
                                className="shrink-0 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                            >
                                {connectBusy ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <GoogleIcon className="h-3.5 w-3.5" />
                                )}
                                Connect Google
                            </Button>
                        </div>
                    )}

                    {needsMicrosoftConnect && (
                        <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-500/30 dark:bg-amber-500/10 sm:flex-row sm:items-center">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                                        Connect Microsoft to host a Teams event
                                    </p>
                                    <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                                        Authorize StaffTime-Track to access your Teams/Outlook calendar before scheduling. Your Microsoft account can differ from your app email.
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                size="sm"
                                onClick={startMicrosoftConnect}
                                disabled={microsoftConnectBusy}
                                className="shrink-0 rounded-lg bg-amber-600 text-white hover:bg-amber-700"
                            >
                                {microsoftConnectBusy ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <MicrosoftIcon className="h-3.5 w-3.5" />
                                )}
                                Connect Microsoft
                            </Button>
                        </div>
                    )}

                    <div className="-mx-5 -mb-5 mt-1 flex flex-col-reverse gap-2 border-t border-borderColor bg-bgSecondary/40 px-5 py-3.5 dark:border-darkBorder dark:bg-darkPrimaryBg/30 sm:-mx-6 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                        <Button
                            type="button"
                            variant="outline2"
                            onClick={onClose}
                            disabled={loading}
                            className="h-10 rounded-lg px-5 text-headingTextColor dark:bg-darkSecondaryBg dark:text-darkTextPrimary"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading || needsGoogleConnect || needsMicrosoftConnect}
                            className="h-10 min-w-36 rounded-lg"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating
                                </>
                            ) : (
                                "Create event"
                            )}
                        </Button>
                    </div>
                </form>
            </Form>
        </DialogContent>
    );
};

export default AddEventModal;
