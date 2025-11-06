"use client";
import {
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { AppWindow, CalendarDays, ChevronDownIcon, ClipboardList, Clock8Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { addManualTimeSchema } from "@/zod/schema";

interface TimePeriod {
    start: number;
    end: number;
}

const AddManualTimeModal = () => {
    const form = useForm<z.infer<typeof addManualTimeSchema>>({
        resolver: zodResolver(addManualTimeSchema),
        defaultValues: {
            project: "",
            task: "",
            timeFrom: "07:30:00",
            timeTo: "08:30:00",
            message: "",
        },
    });

    const timeToDecimal = (time: string): number => {
        const parts = time.split(':');
        // Nullish Coalescing Operator
        // f parts[0] is null or undefined (which are called nullish values)
        // parseInt(..., 10)	This is the standard JavaScript function that takes a string and converts it into an integer (a whole number). 
        // The 10 specifies that the conversion should use base 10 (decimal) counting.
        // By using ?? '0', you ensure that parseInt always receives a string that it can attempt to convert.
        const hours = parseInt(parts[0] ?? '0', 10);
        const minutes = parseInt(parts[1] ?? '0', 10);
        return hours + minutes / 60;
    };

    const projects = ["Orbit Project", "App Redesign", "Marketing Campaign", "New Website"];
    const tasks = ["Website Design", "Working on App Design", "New Landing Page", "Work on helsenist Project"];
    const [taskSearch, setTaskSearch] = useState("");
    const [projectSearch, setProjectSearch] = useState("");

    const filteredProjects = projects.filter(p => p.toLowerCase().includes(projectSearch.toLowerCase()));
    const filteredTasks = tasks.filter(t => t.toLowerCase().includes(taskSearch.toLowerCase()));

    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [activePeriods, setActivePeriods] = useState<TimePeriod[] | undefined>(undefined);
    const [totalTime, setTotalTime] = useState<string>("1:00:00");


    const timeFrom = form.watch("timeFrom"); // form.watch, getting real time data like onChange from react hook form
    const timeTo = form.watch("timeTo");


    useEffect(() => {
        if (timeFrom && timeTo) {
            const startTimeDecimal = timeToDecimal(timeFrom);
            const endTimeDecimal = timeToDecimal(timeTo);
            console.log(startTimeDecimal);
            console.log(endTimeDecimal);
            if (endTimeDecimal > startTimeDecimal) {
                setActivePeriods([
                    { start: startTimeDecimal, end: endTimeDecimal },
                ]);

                const durationInHours = endTimeDecimal - startTimeDecimal;
                const hours = Math.floor(durationInHours);
                const minutes = Math.round((durationInHours - hours) * 60);

                const formattedTime = `${hours.toString().padStart(1, '0')}:${minutes.toString().padStart(2, '0')}:00`;
                setTotalTime(formattedTime);

            } else {
                setActivePeriods(undefined);
                setTotalTime("0:00:00");
            }
        } else {
            setActivePeriods(undefined);
            setTotalTime("0:00:00");
        }
    }, [timeFrom, timeTo]);


    const onSubmit = (data: z.infer<typeof addManualTimeSchema>) => {
        console.log(data);
    };

    return (
        <DialogContent
            onInteractOutside={(event) => event.preventDefault()}
            className=" w-full sm:max-w-[525px] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Add Time</DialogTitle>
                <DialogDescription asChild className="">
                    <Form {...form}>
                        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="flex flex-col gap-4 mt-4 mb-4">
                                <FormField
                                    control={form.control}
                                    name="project"
                                    render={({ field }) => (
                                        <FormItem className=" w-full">
                                            <FormLabel>Project</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <div className=" flex gap-1 items-center">
                                                                <AppWindow className="mr-2" />
                                                                <SelectValue className=" text-start" placeholder="Select Project" />
                                                            </div>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <Input
                                                                type="text"
                                                                placeholder="Search project..."
                                                                className="flex-1 border-none focus:ring-0 focus:outline-none"
                                                                value={projectSearch}
                                                                onChange={(e) => setProjectSearch(e.target.value)}
                                                            />
                                                            {filteredProjects.map(p => (
                                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="task"
                                    render={({ field }) => (
                                        <FormItem className=" w-full">
                                            <FormLabel>Task</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <SelectTrigger className="w-full">
                                                            <div className=" flex gap-1 items-center">
                                                                <ClipboardList className="mr-2" />
                                                                <SelectValue className=" text-start" placeholder="Select Task" />
                                                            </div>
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <Input
                                                                type="text"
                                                                placeholder="Search task..."
                                                                className="flex-1 border-none focus:ring-0 focus:outline-none"
                                                                value={taskSearch}
                                                                onChange={(e) => setTaskSearch(e.target.value)}
                                                            />
                                                            {filteredTasks.map(t => (
                                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem className=" w-full ">
                                            <FormLabel>Date</FormLabel>
                                            <Popover open={open} onOpenChange={setOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline2"
                                                        id="date"
                                                        className="w-full justify-between font-normal py-[5px] flex items-center dark:hover:bg-darkPrimaryBg dark:bg-darkPrimaryBg"
                                                    >
                                                        <div className=" flex items-center dark:text-darkTextPrimary ">
                                                            <CalendarDays className="mr-2 text-muted-foreground" />
                                                            {date ? date.toLocaleDateString() : "Select date"}
                                                        </div>

                                                        <ChevronDownIcon className="ml-2 w-10 h-10" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={date}
                                                        captionLayout="dropdown"
                                                        onSelect={(date) => {
                                                            setDate(date);
                                                            setOpen(false);
                                                            field.onChange(date);
                                                        }}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormLabel className="-mb-1 ">Time</FormLabel>
                                <div className=" flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                                    <FormField
                                        control={form.control}
                                        name="timeFrom"
                                        render={({ field }) => (
                                            <FormItem className=" w-full">
                                                <FormControl className="">
                                                    <div className='relative '>
                                                        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
                                                            <Clock8Icon className='size-4' />
                                                            <span className='sr-only'>Time From</span>
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

                                    <span className="px-2">TO</span>

                                    <FormField
                                        control={form.control}
                                        name="timeTo"
                                        render={({ field }) => (
                                            <FormItem className=" w-full">
                                                <FormControl>
                                                    <div className='relative'>
                                                        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
                                                            <Clock8Icon className='size-4' />
                                                            <span className='sr-only'>Time To</span>
                                                        </div>
                                                        <Input
                                                            type='time'
                                                            id='time-picker2'
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

                                <FormLabel className="-mb-1 mt-2">Total Time: {totalTime}</FormLabel>
                                <div className="relative h-5 bg-[#f6f7f9] dark:bg-darkPrimaryBg rounded-4xl border border-borderColor dark:border-darkBorder">
                                    {activePeriods?.map((period, index) => {
                                        const startPercent = (period.start / 24) * 100;
                                        const endPercent = (period.end / 24) * 100;
                                        const width = endPercent - startPercent;

                                        if (width > 0) {
                                            return (
                                                <div
                                                    key={index}
                                                    className="absolute h-5 bg-green-400 rounded-4xl"
                                                    style={{
                                                        left: `${startPercent}%`,
                                                        width: `${width}%`,
                                                    }}
                                                ></div>
                                            );
                                        }
                                        return null;
                                    })}
                                </div>
                                <div className=" flex justify-between -mt-2">
                                    <span className=" text-sm text-gray-400 dark:text-darkTextSecondary">1h</span>
                                    <span className=" text-sm text-gray-400 dark:text-darkTextSecondary">6h</span>
                                    <span className=" text-sm text-gray-400 dark:text-darkTextSecondary">12h</span>
                                    <span className=" text-sm text-gray-400 dark:text-darkTextSecondary">18h</span>
                                    <span className=" text-sm text-gray-400 dark:text-darkTextSecondary">24h</span>
                                </div>
                                <FormField
                                    control={form.control}
                                    name="message"
                                    render={({ field }) => (
                                        <FormItem className=" w-full ">
                                            <FormLabel>Message</FormLabel>
                                            <FormControl>
                                                <Textarea className="dark:border-darkBorder" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit">Save</Button>
                            </div>
                        </form>
                    </Form>
                </DialogDescription>
            </DialogHeader>
        </DialogContent>
    );
};

export default AddManualTimeModal;