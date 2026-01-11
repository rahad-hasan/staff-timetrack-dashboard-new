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

const EditEventModal = ({ handleCloseDialog, event }: any) => {
    const [loading, setLoading] = useState(false);
    const [openStartDate, setOpenStartDate] = useState(false);

    function toDateOnlyFromUTC(date: string | Date) {
        const d = new Date(date)
        return new Date(
            d.getUTCFullYear(),
            d.getUTCMonth(),
            d.getUTCDate()
        )
    }

    const form = useForm<z.infer<typeof editEventSchema>>({
        resolver: zodResolver(editEventSchema),
        defaultValues: {
            date: toDateOnlyFromUTC(event.date),
        }
    })

    useEffect(() => {
        if (event?.date) {
            form.reset({ date: toDateOnlyFromUTC(event.date) });
        }
    }, [event, form]);

    async function onSubmit(values: z.infer<typeof editEventSchema>) {
        setLoading(true);
        const finalData = {
            new_date: new Date(values.date!).toISOString()
        }
        try {
            const res = await rescheduleEvent({ data: finalData, id: event?.id });
            if (res?.success) {
                toast.success(res?.message || "Rescheduled successfully");
                handleCloseDialog();
            } else {
                toast.error(res?.message || "Failed to reschedule");
            }
        } catch (error: any) {
            toast.error(error?.message || "Something went wrong!");
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