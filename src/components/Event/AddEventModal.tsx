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
import { useEffect, useState } from "react";
import {
    AlertTriangle,
    CalendarDays,
    ChevronDownIcon,
    Video,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
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
import { getGoogleConnected } from "@/actions/integrations/action";
import ClockIcon from "../Icons/ClockIcon";
import { cn } from "@/lib/utils";
import {
    GoogleIcon,
    MicrosoftIcon,
    isConflictResponse,
    parseConflictMessage,
} from "./eventHelpers";
import { useGoogleConnectFlow } from "../Integrations/useGoogleConnectFlow";
import { Loader2 } from "lucide-react";

type FormInput = z.input<typeof addNewEventSchema>;
type FormValues = z.output<typeof addNewEventSchema>;

const buildIsoFromDateAndTime = (date: Date, time: string) => {
    const [h, m, s] = time.split(":").map((v) => Number(v) || 0);
    const dt = new Date(date);
    dt.setHours(h, m, s ?? 0, 0);
    return dt;
};

const AddEventModal = ({ onClose }: { onClose: () => void }) => {
    const [members, setMembers] = useState<
        { id: number | string; name: string; image?: string }[]
    >([]);
    const [loading, setLoading] = useState(false);
    const [openStartDate, setOpenStartDate] = useState(false);
    const [conflicts, setConflicts] = useState<string[]>([]);
    const [googleConnected, setGoogleConnected] = useState<boolean | null>(null);

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

    const refreshGoogleConnected = async () => {
        try {
            const res: any = await getGoogleConnected();
            const data = res?.data ?? res;
            setGoogleConnected(!!data?.connected);
        } catch {
            setGoogleConnected(false);
        }
    };

    const { start: startGoogleConnect, busy: connectBusy } = useGoogleConnectFlow(
        () => refreshGoogleConnected(),
    );

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
    }, [conferenceProvider, googleConnected]);

    const needsGoogleConnect =
        conferenceProvider === "google" && googleConnected === false;

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
            className="w-full max-w-[calc(100vw-2rem)] sm:max-w-160 md:max-w-205 lg:max-w-230 max-h-[95vh] overflow-y-auto p-0 gap-0 dark:bg-darkSecondaryBg"
        >
            <DialogHeader className="px-5 sm:px-6 pt-5 pb-4 border-b dark:border-darkBorder">
                <DialogTitle className="text-headingTextColor dark:text-darkTextPrimary text-lg font-semibold">
                    Create new event
                </DialogTitle>
                <DialogDescription className="text-xs text-subTextColor dark:text-darkTextSecondary">
                    Schedule a meeting and optionally generate a Meet or Teams link.
                    Connected attendees will be auto-synced to their Google Calendar.
                </DialogDescription>
            </DialogHeader>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="px-5 sm:px-6 py-5 space-y-4"
                >
                    {conflicts.length > 0 && (
                        <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50/70 dark:bg-red-500/10 p-3 space-y-2">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                        {/* LEFT COLUMN */}
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="eventName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>Event name</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                className="dark:bg-darkPrimaryBg dark:border-darkBorder"
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
                                        <FormLabel required>Date</FormLabel>
                                        <FormControl>
                                            <Popover
                                                open={openStartDate}
                                                onOpenChange={setOpenStartDate}
                                            >
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline2"
                                                        type="button"
                                                        className="w-full py-1.5 justify-between font-normal dark:text-darkTextSecondary dark:bg-darkPrimaryBg dark:border-darkBorder"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <CalendarDays className="h-4 w-4" />
                                                            {field.value
                                                                ? field.value.toLocaleDateString()
                                                                : "Set a date"}
                                                        </div>
                                                        <ChevronDownIcon className="h-4 w-4" />
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
                                                        className="peer bg-background dark:bg-darkPrimaryBg dark:border-darkBorder appearance-none pl-9 [&::-webkit-calendar-picker-indicator]:hidden"
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
                                                        className="peer bg-background dark:bg-darkPrimaryBg dark:border-darkBorder appearance-none pl-9 [&::-webkit-calendar-picker-indicator]:hidden"
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
                                        <FormLabel required>Attendees</FormLabel>
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
                                                <MultiSelectTrigger className="w-full hover:bg-white py-2 dark:bg-darkPrimaryBg hover:dark:bg-darkPrimaryBg dark:border-darkBorder">
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
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                className="dark:bg-darkPrimaryBg dark:border-darkBorder resize-none min-h-28"
                                                placeholder="What is this event about?"
                                                rows={5}
                                                maxLength={100}
                                                {...field}
                                            />
                                        </FormControl>
                                        <p className="text-[11px] text-subTextColor dark:text-darkTextSecondary text-right">
                                            {field.value?.length ?? 0}/100
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
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { v: "none", label: "None", icon: null },
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
                                                            "flex flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-3 text-[11px] sm:text-xs font-medium transition cursor-pointer",
                                                            active
                                                                ? "border-primary bg-primary/10 text-primary"
                                                                : "border-borderColor dark:border-darkBorder bg-white dark:bg-darkPrimaryBg text-subTextColor dark:text-darkTextSecondary hover:border-primary/40",
                                                        )}
                                                    >
                                                        <div className="flex h-5 items-center">
                                                            {opt.icon ?? <Video className="h-4 w-4" />}
                                                        </div>
                                                        {opt.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <p className="text-[11px] text-subTextColor dark:text-darkTextSecondary leading-snug">
                                            Events are automatically synced to attendees&apos; connected
                                            Google Calendar. Unconnected attendees will appear as
                                            <span className="font-semibold"> pending connection</span>.
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {needsGoogleConnect && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/70 dark:bg-amber-500/10 p-3">
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
                                className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
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

                    <Button
                        className="w-full mt-2"
                        type="submit"
                        disabled={loading || needsGoogleConnect}
                    >
                        {loading ? "Creating..." : "Create event"}
                    </Button>
                </form>
            </Form>
        </DialogContent>
    );
};

export default AddEventModal;
