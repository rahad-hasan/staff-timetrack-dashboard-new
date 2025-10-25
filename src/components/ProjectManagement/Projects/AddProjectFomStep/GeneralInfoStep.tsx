"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { generalInfoSchema } from "@/zod/schema";
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

interface GeneralInfoStepProps {
    setStep: (step: number) => void;
    handleStepSubmit: (data: any) => void;
}

const GeneralInfoStep = ({ setStep, handleStepSubmit }: GeneralInfoStepProps) => {
    const client = ["Orbit Project", "App Redesign", "Marketing Campaign", "New Website"];
    const manager = ["Website Design", "Working on App Design", "New Landing Page", "Work on helsenist Project"];
    const [managerSearch, setManagerSearch] = useState("");
    const [clientSearch, setClientSearch] = useState("");

    const filteredClient = client.filter(p => p.toLowerCase().includes(clientSearch.toLowerCase()));
    const filteredManager = manager.filter(t => t.toLowerCase().includes(managerSearch.toLowerCase()));

    const [openStartDate, setOpenStartDate] = useState(false);
    const [dateStartDate, setStartDate] = useState<Date | undefined>(undefined);

    const [openDeadLine, setDeadLineOpen] = useState(false);
    const [dateDeadLine, setDeadLineDate] = useState<Date | undefined>(undefined);


    const form = useForm<z.infer<typeof generalInfoSchema>>({
        resolver: zodResolver(generalInfoSchema),
        defaultValues: {
            projectName: "",
            client: "",
            manager: "",
            description: "",
            phone: "",
        },
    })

    function onSubmit(values: z.infer<typeof generalInfoSchema>) {
        console.log(values)
        handleStepSubmit(values)
        setStep(2);
    }

    return (
        <div>
            <h2 className=" text-xl font-semibold mb-4">General Info</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 ">
                    <FormField
                        control={form.control}
                        name="projectName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Project Name</FormLabel>
                                <FormControl>
                                    <Input type="text" className="" placeholder="Project Name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="client"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Client</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger className="w-full">
                                                <div className=" flex gap-1 items-center">
                                                    <CircleUserRound className="mr-2" />
                                                    <SelectValue className=" text-start" placeholder="Select Client" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <Input
                                                    type="text"
                                                    placeholder="Select Client"
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
                        name="manager"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Manager</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger className="w-full">
                                                <div className=" flex gap-1 items-center">
                                                    <CircleUserRound className="mr-2" />
                                                    <SelectValue className=" text-start" placeholder="Select Manager" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <Input
                                                    type="text"
                                                    placeholder="Select Manager"
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
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex flex-col md:flex-row gap-4 md:gap-3">
                        {/* Start Date */}
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
                                                    id="startDate"
                                                    className="py-1.5 justify-between font-normal dark:text-darkTextPrimary"
                                                >
                                                    {dateStartDate ? dateStartDate.toLocaleDateString() : "Select Start Date"}
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

                        {/* Deadline Date */}
                        <FormField
                            control={form.control}
                            name="deadline"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Deadline</FormLabel>
                                    <FormControl>
                                        <Popover open={openDeadLine} onOpenChange={setDeadLineOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline2"
                                                    id="deadline"
                                                    className="py-1.5 justify-between font-normal dark:text-darkTextPrimary"
                                                >
                                                    {dateDeadLine ? dateDeadLine.toLocaleDateString() : "Select Deadline"}
                                                    <ChevronDownIcon />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={dateDeadLine}
                                                    captionLayout="dropdown"
                                                    onSelect={(date) => {
                                                        setDeadLineDate(date);
                                                        field.onChange(date); // Update the form state
                                                        setDeadLineOpen(false);
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
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                    <Input type="text" className="" placeholder="Phone Number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button className=" w-full" type="submit">Next</Button>
                </form>
            </Form>
        </div>
    );
};

export default GeneralInfoStep;