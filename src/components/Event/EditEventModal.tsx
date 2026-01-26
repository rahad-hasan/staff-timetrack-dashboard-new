/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { Button } from "@/components/ui/button";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
} from "@/components/ui/popover"
import { useEffect, useState } from "react";
import { CalendarDays, ChevronDownIcon, } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { rescheduleEvent } from "@/actions/calendarEvent/action";
import { toast } from "sonner";
import { toZonedTime } from "date-fns-tz";
import { useLogInUserStore } from "@/store/logInUserStore";
import ClockIcon from "../Icons/ClockIcon";
import { Input } from "../ui/input";

const formatToTimeString = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
};

const EditEventModal = ({ handleCloseDialog, event }: any) => {

    const [loading, setLoading] = useState(false);
    const [openStartDate, setOpenStartDate] = useState(false);
    const logInUserData = useLogInUserStore(state => state.logInUserData);
    // console.log('getting from zustand', logInUserData?.timezone);
    function utcToUserDate(date: string | Date) {
        return toZonedTime(new Date(date), logInUserData?.timezone);
    }
    const zonedDate = event?.start_time && utcToUserDate(event.start_time);
    const zonedStartTime = event?.start_time && utcToUserDate(event.start_time);
    const zonedEndTime = event?.end_time && utcToUserDate(event.end_time);

    const form = useForm<z.infer<typeof editEventSchema>>({
        resolver: zodResolver(editEventSchema),
        defaultValues: {
            date: zonedDate,
            start_time: formatToTimeString(zonedStartTime),
            end_time: formatToTimeString(zonedEndTime)
        },
    });

    useEffect(() => {
        if (event?.date) {
            form.reset({
                date: zonedDate,
                start_time: formatToTimeString(zonedDate),
                end_time: formatToTimeString(zonedDate)
            });
        }
    }, [event, form]);

    async function onSubmit(values: z.infer<typeof editEventSchema>) {

        const combinedStartTime = new Date(values.date!);
        const [startHours, startMinutes, startSeconds] = values.start_time.split(":").map(Number);
        combinedStartTime.setHours(startHours || 0);
        combinedStartTime.setMinutes(startMinutes || 0);
        combinedStartTime.setSeconds(startSeconds || 0);

        const combinedEndTime = new Date(values.date!);
        const [endHours, endMinutes, endSeconds] = values.end_time.split(":").map(Number);
        combinedEndTime.setHours(endHours || 0);
        combinedEndTime.setMinutes(endMinutes || 0);
        combinedEndTime.setSeconds(endSeconds || 0);

        setLoading(true);
        const finalData = {
            start_time: combinedStartTime.toISOString(),
            end_time: combinedEndTime.toISOString(),
        }

        try {
            const res = await rescheduleEvent({ data: finalData, id: event?.id });
            if (res?.success) {
                toast.success(res?.message || "Rescheduled successfully");

                // fix flickering issue
                setTimeout(() => {
                    handleCloseDialog();
                }, 0);

            } else {
                toast.error(res?.message || "Failed to reschedule", {
                    style: {
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none'
                    },
                });
            }
        } catch (error: any) {
            toast.error(error?.message || "Something went wrong!", {
                style: {
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none'
                },
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <DialogContent
            onInteractOutside={(event) => event.preventDefault()}

            className="w-full sm:max-w-[525px] max-h-[95vh] overflow-y-auto"
        >
            <DialogHeader>
                <DialogTitle className="mb-4 text-headingTextColor dark:text-darkTextPrimary">
                    Reschedule Event: {event?.name}
                </DialogTitle>
            </DialogHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Change Event Date</FormLabel>
                                <FormControl>
                                    <Popover open={openStartDate} onOpenChange={setOpenStartDate}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline2"
                                                className="w-full py-1.5 justify-between font-normal dark:text-darkTextSecondary dark:bg-darkPrimaryBg dark:border-darkBorder"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4" />
                                                    {/* WATCH the form value directly */}
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
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className=" flex items-center gap-3">
                        <FormField
                            control={form.control}
                            name="start_time"
                            render={({ field }) => (
                                <FormItem className=" w-full">
                                    <FormLabel>Start Time</FormLabel>
                                    <FormControl className="">
                                        <div className='relative '>
                                            <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
                                                <ClockIcon size={16} className=" text-headingTextColor dark:text-darkTextPrimary" />
                                            </div>
                                            <Input
                                                type='time'
                                                id='time-picker'
                                                step='1'
                                                {...field}
                                                className='peer bg-background dark:bg-darkPrimaryBg dark:border-darkBorder appearance-none pl-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
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
                                <FormItem className=" w-full">
                                    <FormLabel>End Time</FormLabel>
                                    <FormControl className="">
                                        <div className='relative '>
                                            <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
                                                <ClockIcon size={16} className=" text-headingTextColor dark:text-darkTextPrimary" />
                                            </div>
                                            <Input
                                                type='time'
                                                id='time-picker'
                                                step='1'
                                                {...field}
                                                className='peer bg-background dark:bg-darkPrimaryBg dark:border-darkBorder appearance-none pl-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button
                        className="w-full"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Updating..." : "Reschedule Event"}
                    </Button>
                </form>
            </Form>
        </DialogContent>
    );
};

export default EditEventModal;