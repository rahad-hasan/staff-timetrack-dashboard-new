"use client"
import { Button } from "@/components/ui/button";
import {
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { leaveRequestSchema } from "@/zod/schema";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";

const LeaveRequestModal = () => {
    const leave = ["Casul Leave", "Sick Leave ", "Earned Leave"];
    const [clientSearch, setClientSearch] = useState("");

    const filteredLeave = leave.filter((p) =>
        p.toLowerCase().includes(clientSearch.toLowerCase())
    );

    const [openStartDate, setOpenStartDate] = useState(false);
    const [startDate, setStartDate] = useState<Date | undefined>();

    const [openEndDate, setOpenEndDate] = useState(false);
    const [endDate, setEndDate] = useState<Date | undefined>();

    const form = useForm<z.infer<typeof leaveRequestSchema>>({
        resolver: zodResolver(leaveRequestSchema),
        defaultValues: {
            leaveType: "",
            startDate: undefined,
            endDate: undefined,
            details: "",
        },
    });

    function onSubmit(values: z.infer<typeof leaveRequestSchema>) {
        console.log(values);
    }

    return (
        <DialogContent className=" w-full sm:max-w-[525px] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="mb-4">Leave request</DialogTitle>
            </DialogHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="leaveType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Select leave type</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <Input
                                                    type="text"
                                                    placeholder="Search..."
                                                    className="flex-1 border-none focus:ring-0 focus:outline-none mb-1"
                                                    value={clientSearch}
                                                    onChange={(e) => setClientSearch(e.target.value)}
                                                />
                                                {filteredLeave.map((p) => (
                                                    <SelectItem key={p} value={p}>
                                                        {p}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className=" flex flex-col md:flex-row gap-4 md:gap-3">
                        <FormField
                            control={form.control}
                            name="startDate"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Start Date</FormLabel>
                                    <FormControl>
                                        <Popover open={openStartDate} onOpenChange={setOpenStartDate}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline2"
                                                    className="py-1.5 justify-between font-normal dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                                                >
                                                    {startDate
                                                        ? startDate.toLocaleDateString()
                                                        : "Select Start Date"}
                                                    <ChevronDownIcon />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={startDate}
                                                    captionLayout="dropdown"
                                                    onSelect={(date) => {
                                                        setStartDate(date);
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

                        <FormField
                            control={form.control}
                            name="endDate"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>End Date</FormLabel>
                                    <FormControl>
                                        <Popover open={openEndDate} onOpenChange={setOpenEndDate}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline2"
                                                    className="py-1.5 justify-between font-normal dark:text-darkTextPrimary dark:bg-darkPrimaryBg "
                                                >
                                                    {endDate
                                                        ? endDate.toLocaleDateString()
                                                        : "Select End Date"}
                                                    <ChevronDownIcon />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={endDate}
                                                    captionLayout="dropdown"
                                                    onSelect={(date) => {
                                                        setEndDate(date);
                                                        field.onChange(date);
                                                        setOpenEndDate(false);
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="details"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Details</FormLabel>
                                <FormControl>
                                    <Textarea className="dark:border-darkBorder" placeholder="Enter details" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex items-center gap-3 w-full">
                        <DialogClose asChild>
                            <Button variant="outline2" className="dark:border-darkBorder dark:text-darkTextPrimary dark:bg-darkPrimaryBg">Cancel</Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button type="submit">Submit Request</Button>
                        </DialogClose>
                    </div>
                </form>
            </Form>
        </DialogContent>
    );
};

export default LeaveRequestModal;
