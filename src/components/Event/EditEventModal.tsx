/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "@/components/ui/button";
import { editEventSchema } from "@/zod/schema";
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
import { useState } from "react";
import { AlertTriangle, CalendarDays, ChevronDownIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { rescheduleEvent } from "@/actions/calendarEvent/action";
import { toast } from "sonner";
import { toZonedTime } from "date-fns-tz";
import { useLogInUserStore } from "@/store/logInUserStore";
import ClockIcon from "../Icons/ClockIcon";
import { Input } from "../ui/input";
import { isConflictResponse, parseConflictMessage } from "./eventHelpers";

const formatToTimeString = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
};

const buildIsoFromDateAndTime = (date: Date, time: string) => {
    const [h, m, s] = time.split(":").map((v) => Number(v) || 0);
    const dt = new Date(date);
    dt.setHours(h, m, s ?? 0, 0);
    return dt;
};

const EditEventModal = ({ handleCloseDialog, event }: any) => {
    const [loading, setLoading] = useState(false);
    const [openStartDate, setOpenStartDate] = useState(false);
    const [conflicts, setConflicts] = useState<string[]>([]);

    const logInUserData = useLogInUserStore((state) => state.logInUserData);
    const tz = logInUserData?.timezone || logInUserData?.time_zone;

    const utcToUserDate = (date: string | Date) =>
        tz ? toZonedTime(new Date(date), tz) : new Date(date);
    const zonedDate = event?.start_time && utcToUserDate(event.start_time);
    const zonedStartTime = event?.start_time && utcToUserDate(event.start_time);
    const zonedEndTime = event?.end_time && utcToUserDate(event.end_time);

    type FormInput = z.input<typeof editEventSchema>;
    type FormOutput = z.output<typeof editEventSchema>;

    const form = useForm<FormInput, any, FormOutput>({
        resolver: zodResolver(editEventSchema),
        defaultValues: {
            date: zonedDate,
            start_time: zonedStartTime ? formatToTimeString(zonedStartTime) : "09:00:00",
            end_time: zonedEndTime ? formatToTimeString(zonedEndTime) : "09:30:00",
        },
    });

    const submitWith = async (
        values: z.infer<typeof editEventSchema>,
        force: boolean,
    ) => {
        const startDt = buildIsoFromDateAndTime(values.date!, values.start_time);
        const endDt = buildIsoFromDateAndTime(values.date!, values.end_time);

        const res = await rescheduleEvent({
            id: event?.id,
            data: {
                start_time: startDt.toISOString(),
                end_time: endDt.toISOString(),
                force_create: force,
            },
        });
        return { ok: !!res?.success, res };
    };

    async function onSubmit(values: z.infer<typeof editEventSchema>) {
        setLoading(true);
        setConflicts([]);
        try {
            const { ok, res } = await submitWith(values, false);
            if (ok) {
                toast.success(res?.message || "Event rescheduled successfully");
                setTimeout(() => handleCloseDialog(), 0);
                return;
            }
            if (isConflictResponse(res)) {
                setConflicts(parseConflictMessage(res?.message));
                return;
            }
            toast.error(res?.message || "Failed to reschedule", {
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
        const values = form.getValues() as z.infer<typeof editEventSchema>;
        setLoading(true);
        try {
            const { ok, res } = await submitWith(values, true);
            if (ok) {
                toast.success(res?.message || "Event rescheduled successfully");
                setConflicts([]);
                setTimeout(() => handleCloseDialog(), 0);
                return;
            }
            toast.error(res?.message || "Failed to reschedule", {
                style: { backgroundColor: "#ef4444", color: "white", border: "none" },
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                Reschedule anyway
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
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel required>New date</FormLabel>
                            <FormControl>
                                <Popover open={openStartDate} onOpenChange={setOpenStartDate}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline2"
                                            type="button"
                                            className="w-full py-1.5 justify-between font-normal dark:text-darkTextSecondary dark:bg-darkPrimaryBg dark:border-darkBorder"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4" />
                                                {field.value ? field.value.toLocaleDateString() : "Set a date"}
                                            </div>
                                            <ChevronDownIcon className="h-4 w-4" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value!}
                                            onSelect={(date) => {
                                                field.onChange(date);
                                                setOpenStartDate(false);
                                            }}
                                            disabled={(d) => {
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                return d < today;
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex items-center gap-3">
                    <FormField
                        control={form.control}
                        name="start_time"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel required>Start time</FormLabel>
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
                            <FormItem className="w-full">
                                <FormLabel required>End time</FormLabel>
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
                <Button className="w-full" type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Reschedule event"}
                </Button>
            </form>
        </Form>
    );
};

export default EditEventModal;
