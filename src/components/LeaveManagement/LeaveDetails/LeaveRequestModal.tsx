/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { toast } from "sonner";
import { addLeave } from "@/actions/leaves/action";
import { format } from "date-fns";

const LeaveRequestModal = ({ onClose }: { onClose: () => void }) => {
    const [loading, setLoading] = useState(false);
    // const leave = ["Casual Leave", "Sick Leave ", "Earned Leave"];
    const leave = [
        {
            label: "Casual Leave",
            value: "casual"
        },
        {
            label: "Sick Leave",
            value: "sick"
        },
        {
            label: "Maternity Leave",
            value: "maternity"
        },
        {
            label: "Paid Leave",
            value: "paid"
        },
    ]
    const [leaveTypeSearch, setLeaveTypeSearch] = useState("");

    const filteredLeave = leave.filter((p) =>
        p.label.toLowerCase().includes(leaveTypeSearch.toLowerCase())
    );

    const [openStartDate, setOpenStartDate] = useState(false);
    const [startDate, setStartDate] = useState<Date | undefined>();

    const [openEndDate, setOpenEndDate] = useState(false);
    const [endDate, setEndDate] = useState<Date | undefined>();

    const form = useForm<z.infer<typeof leaveRequestSchema>>({
        resolver: zodResolver(leaveRequestSchema),
        defaultValues: {
            leaveType: "",
            startDate: null,
            endDate: null,
            reason: "",
        },
    });

    async function onSubmit(values: z.infer<typeof leaveRequestSchema>) {

        const finalData = {
            type: values.leaveType,
            // Non-null Assertion Operator (!)
            start_date: format(new Date(values.startDate!), "yyyy-MM-dd"),
            end_date: format(new Date(values.endDate!), "yyyy-MM-dd"),
            reason: values.reason
        }

        setLoading(true);
        try {
            const res = await addLeave(finalData);

            if (res?.success) {
                onClose();
                form.reset();
                toast.success(res?.message || "Leave request successfully");
            } else {
                toast.error(res?.message || "Failed to request leave");
            }
        } catch (error: any) {
            console.error("failed:", error);
            toast.error(error?.message || "Something went wrong!");
        } finally {
            setLoading(false);
        }
    }

    return (
        <DialogContent
            onInteractOutside={(event) => event.preventDefault()}
            className=" w-full sm:max-w-[525px] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className="mb-4 text-headingTextColor dark:text-darkTextPrimary">Leave request</DialogTitle>
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
                                                    value={leaveTypeSearch}
                                                    onChange={(e) => setLeaveTypeSearch(e.target.value)}
                                                />
                                                {filteredLeave.map((p) => (
                                                    <SelectItem key={p.value} value={p.value}>
                                                        {p.label}
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
                                                        ? format(startDate, "dd-MM-yyyy")
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
                                                        ? format(endDate, "dd-MM-yyyy")
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
                        name="reason"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reason</FormLabel>
                                <FormControl>
                                    <Textarea className="dark:border-darkBorder" placeholder="Type reason" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex items-center gap-3 w-full">
                        <DialogClose asChild>
                            <Button variant="outline2" className="dark:border-darkBorder dark:text-darkTextPrimary dark:bg-darkPrimaryBg">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={loading}> {loading ? "Loading..." : "Submit Request"}</Button>
                    </div>
                </form>
            </Form>
        </DialogContent>
    );
};

export default LeaveRequestModal;
