"use client"
import { Button } from "@/components/ui/button";
import {
    DialogClose,
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
import { useState } from "react";
import { CalendarDays, ChevronDownIcon, } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

const EditEventModal = () => {


    const [openStartDate, setOpenStartDate] = useState(false);
    const [dateStartDate, setStartDate] = useState<Date | undefined>(new Date());

    const form = useForm<z.infer<typeof editEventSchema>>({
        resolver: zodResolver(editEventSchema),
        defaultValues: {
            date: null,
        }
    })

    function onSubmit(values: z.infer<typeof editEventSchema>) {
        console.log(values)
    }


    return (
        <DialogContent
            onInteractOutside={(event) => event.preventDefault()}
            className=" w-full sm:max-w-[525px] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className=" mb-4 text-headingTextColor dark:text-darkTextPrimary">Edit Event</DialogTitle>
            </DialogHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 ">
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
                                                id="startDate"
                                                className="py-1.5 justify-between font-normal dark:text-darkTextSecondary dark:bg-darkPrimaryBg dark:border-darkBorder"
                                            >
                                                <div className=" flex items-center gap-2">
                                                    <CalendarDays />
                                                    {dateStartDate ? dateStartDate.toLocaleDateString() : "Set a date"}
                                                </div>

                                                <ChevronDownIcon />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={dateStartDate}
                                                captionLayout="dropdown"
                                                onSelect={(date) => {
                                                    setStartDate(date);
                                                    field.onChange(date); // Update the form state
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

                    <DialogClose asChild>
                        <Button className=" w-full" type="submit">Reschedule Event</Button>
                    </DialogClose>
                </form>
            </Form>
        </DialogContent>
    );
};

export default EditEventModal;