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
import { useState } from "react";
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

    const projects = ["Orbit Project", "App Redesign", "Marketing Campaign", "New Website"];
    const tasks = ["Website Design", "Working on App Design", "New Landing Page", "Work on helsenist Project"];
    const [taskSearch, setTaskSearch] = useState("");
    const [projectSearch, setProjectSearch] = useState("");

    const filteredProjects = projects.filter(p => p.toLowerCase().includes(projectSearch.toLowerCase()));
    const filteredTasks = tasks.filter(t => t.toLowerCase().includes(taskSearch.toLowerCase()));

    const [open, setOpen] = useState(false);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [activePeriods, setActivePeriods] = useState<Array<{ start: number; end: number }> | undefined>(undefined);


    const onSubmit = (data: z.infer<typeof addManualTimeSchema>) => {
        console.log(data);
        const timeToDecimal = (time: string) => {
            const [hours, minutes] = time.split(':').map(Number);
            return hours + minutes / 60;
        };

        const startTimeDecimal = timeToDecimal(data.timeFrom);
        const endTimeDecimal = timeToDecimal(data.timeTo);
       setActivePeriods( [
            { start: startTimeDecimal, end: endTimeDecimal },
        ])
    };
    // const activePeriods = [
    //     { start: 13, end: 16 },
    // ];

    return (
        <DialogContent>
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
                                        <FormItem>
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
                                        <FormItem>
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
                                        <FormItem>
                                            <FormLabel>Date</FormLabel>
                                            <Popover open={open} onOpenChange={setOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline2"
                                                        id="date"
                                                        className="w-full justify-between font-normal py-[5px] flex items-center"
                                                    >
                                                        <div className=" flex items-center">
                                                            <CalendarDays className="mr-2 text-muted-foreground" />
                                                            {date ? date.toLocaleDateString() : "Select date"}
                                                        </div>

                                                        <ChevronDownIcon className="ml-2" />
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
                                <FormLabel className="-mb-1">Time</FormLabel>
                                <div className=" flex gap-3 items-center">
                                    {/* Time From */}
                                    <FormField
                                        control={form.control}
                                        name="timeFrom"
                                        render={({ field }) => (
                                            <FormItem className=" w-full">
                                                <FormControl>
                                                    <div className='relative'>
                                                        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
                                                            <Clock8Icon className='size-4' />
                                                            <span className='sr-only'>User</span>
                                                        </div>
                                                        <Input
                                                            type='time'
                                                            id='time-picker'
                                                            step='1'
                                                            {...field}
                                                            className='peer bg-background appearance-none pl-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <span className="px-2">TO</span>
                                    {/* Time To */}
                                    <FormField
                                        control={form.control}
                                        name="timeTo"
                                        render={({ field }) => (
                                            <FormItem className=" w-full">
                                                <FormControl>
                                                    <div className='relative'>
                                                        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
                                                            <Clock8Icon className='size-4' />
                                                            <span className='sr-only'>User</span>
                                                        </div>
                                                        <Input
                                                            type='time'
                                                            id='time-picker2'
                                                            step='1'
                                                            {...field}
                                                            className='peer bg-background appearance-none pl-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormLabel className="-mb-1 mt-2">Total Time: 1:00:00</FormLabel>
                                <div className="relative h-5 bg-[#f6f7f9] rounded-4xl border border-borderColor">
                                    {activePeriods?.map((period, index) => {
                                        const startPercent = (period.start / 24) * 100;
                                        const endPercent = (period.end / 24) * 100;
                                        const width = endPercent - startPercent;

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
                                    })}
                                </div>
                                <div className=" flex justify-between -mt-2">
                                    <span className=" text-sm text-gray-400">1h</span>
                                    <span className=" text-sm text-gray-400">6h</span>
                                    <span className=" text-sm text-gray-400">12h</span>
                                    <span className=" text-sm text-gray-400">18h</span>
                                    <span className=" text-sm text-gray-400">24h</span>
                                </div>

                                {/* Message */}
                                <FormField
                                    control={form.control}
                                    name="message"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Message</FormLabel>
                                            <FormControl>
                                                <Textarea {...field} />
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