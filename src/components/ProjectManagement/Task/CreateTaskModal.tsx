"use client"
import { Button } from "@/components/ui/button";
import {
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { newTaskCreationSchema } from "@/zod/schema";
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
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ChevronDownIcon, CircleUserRound, } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";

const CreateTaskModal = () => {
    const client = ["Orbit Project", "App Redesign", "Marketing Campaign", "New Website"];
    const manager = ["Website Design", "Working on App Design", "New Landing Page", "Work on helsenist Project"];
    const [managerSearch, setManagerSearch] = useState("");
    const [clientSearch, setClientSearch] = useState("");

    const filteredClient = client.filter(p => p.toLowerCase().includes(clientSearch.toLowerCase()));
    const filteredManager = manager.filter(t => t.toLowerCase().includes(managerSearch.toLowerCase()));

    const [openStartDate, setOpenStartDate] = useState(false);
    const [dateStartDate, setStartDate] = useState<Date | undefined>(undefined);

    const form = useForm<z.infer<typeof newTaskCreationSchema>>({
        resolver: zodResolver(newTaskCreationSchema),
        defaultValues: {
            assignee: "",
            project: "",
            taskName: "",
            details: "",
        },
    })

    function onSubmit(values: z.infer<typeof newTaskCreationSchema>) {
        console.log(values)
    }

    return (
        <DialogContent className="w-full sm:max-w-[525px] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className=" mb-4">Create New Task</DialogTitle>
            </DialogHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 ">
                    <FormField
                        control={form.control}
                        name="assignee"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Assignee</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger className="w-full">
                                                <div className=" flex gap-1 items-center">
                                                    <CircleUserRound className="mr-2" />
                                                    <SelectValue className=" text-start" placeholder="Select Assignee" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <Input
                                                    type="text"
                                                    placeholder="Select Assignee"
                                                    className="flex-1 border-none focus:ring-0 focus:outline-none"
                                                    value={clientSearch}
                                                    onChange={(e) => setClientSearch(e.target.value)}
                                                />
                                                {filteredClient.map(p => (
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
                                                    <SelectValue className=" text-start" placeholder="Select Project" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <Input
                                                    type="text"
                                                    placeholder="Select Project"
                                                    className="flex-1 border-none focus:ring-0 focus:outline-none"
                                                    value={managerSearch}
                                                    onChange={(e) => setManagerSearch(e.target.value)}
                                                />
                                                {filteredManager.map(p => (
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
                        name="taskName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Task Name</FormLabel>
                                <FormControl>
                                    <Input type="text" className="" placeholder="Task Name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="deadline"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Deadline</FormLabel>
                                <FormControl>
                                    <Popover open={openStartDate} onOpenChange={setOpenStartDate}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline2"
                                                id="startDate"
                                                className="py-1.5 justify-between font-normal"
                                            >
                                                {dateStartDate ? dateStartDate.toLocaleDateString() : "Set a deadline"}
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
                    <FormField
                        control={form.control}
                        name="details"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Task Details</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Task Details" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <DialogClose asChild>
                        <Button className=" w-full" type="submit">Create Task</Button>
                    </DialogClose>
                </form>
            </Form>
        </DialogContent>
    );
};

export default CreateTaskModal;