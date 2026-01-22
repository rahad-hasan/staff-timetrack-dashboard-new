"use client"

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
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { ChevronDownIcon, CircleUserRound, } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { MultiSelect, MultiSelectContent, MultiSelectGroup, MultiSelectItem, MultiSelectTrigger, MultiSelectValue } from "@/components/ui/multi-select";
import { useProjectFormStore } from "@/store/ProjectFormStore";
import { getClients } from "@/actions/clients/action";
import { getMembersDashboard } from "@/actions/members/action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { IProject } from "@/types/type";

interface GeneralInfoStepProps {
    setStep: (step: number) => void;
    selectedProject: IProject;
}

const EditGeneralInfoStep = ({ setStep, selectedProject }: GeneralInfoStepProps) => {
    const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
    const [members, setMembers] = useState<{ id: number; name: string; image?: string }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadClients = async () => {
            setLoading(true);
            try {
                const res = await getClients();
                if (res?.success) {
                    setClients(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch clients", err);
            } finally {
                setLoading(false);
            }
        };

        loadClients();
    }, []);

    useEffect(() => {
        const loadMembers = async () => {
            setLoading(true);
            try {
                const res = await getMembersDashboard();
                if (res?.success) {
                    setMembers(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch clients", err);
            } finally {
                setLoading(false);
            }
        };

        loadMembers();
    }, []);

    const data = useProjectFormStore(state => state.data);
    const [clientSearch, setClientSearch] = useState("");

    const filteredClient = clients.filter(c =>
        c.name.toLowerCase().includes(clientSearch.toLowerCase())
    );

    const [openStartDate, setOpenStartDate] = useState(false);
    const [dateStartDate, setStartDate] = useState<Date | undefined>(
        data.startDate ? new Date(data.startDate) : selectedProject?.start_date ? new Date(selectedProject?.start_date) : undefined
    );

    const [openDeadLine, setDeadLineOpen] = useState(false);
    const [dateDeadLine, setDeadLineDate] = useState<Date | undefined>(
        data.deadline ? new Date(data.deadline) : selectedProject?.deadline ? new Date(selectedProject?.deadline) : undefined
    );

    const form = useForm<z.infer<typeof generalInfoSchema>>({
        resolver: zodResolver(generalInfoSchema),
        defaultValues: {
            projectName: data.projectName ? data.projectName : selectedProject?.name,
            client: data.client ? data.client : selectedProject?.client_id,
            members: data.members ? data.members : selectedProject?.projectAssigns?.map(p => ({ id: p?.user?.id, name: p?.user?.name })),
            description: data.description ? data?.description : selectedProject?.description,
            startDate: data.startDate ? data.startDate : selectedProject?.start_date ? new Date(selectedProject?.start_date) : null,
            deadline: data.deadline ? data.deadline : selectedProject?.deadline ? new Date(selectedProject?.deadline) : null,
            // phone: data.phone ?? "",
        },
    })

    const { updateData } = useProjectFormStore();


    function onSubmit(values: z.infer<typeof generalInfoSchema>) {
        updateData(values)
        setStep(2);
    }

    const selectedMemberIds =
        form.watch("members")?.map(m => String(m.id)) || [];

    return (
        <div>
            <h2 className=" text-xl font-medium mb-4 text-headingTextColor dark:text-darkTextPrimary">Edit General Info</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 ">
                    <FormField
                        control={form.control}
                        name="projectName"
                        render={({ field }) => (
                            <FormItem className="dark:text-darkTextPrimary">
                                <FormLabel>Project Name</FormLabel>
                                <FormControl className="">
                                    <Input type="text" className="dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary" placeholder="Project Name" {...field} />
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
                                    <Select
                                        value={field.value ? String(field.value) : ""}
                                        onValueChange={(val) => field.onChange(Number(val))}
                                    >
                                        <SelectTrigger className="w-full">
                                            <div className=" flex gap-1 items-center">
                                                <CircleUserRound className="mr-2" />
                                                <SelectValue placeholder="Select Client" />
                                            </div>
                                        </SelectTrigger>

                                        <SelectContent>
                                            <Input
                                                placeholder="Search client"
                                                value={clientSearch}
                                                onChange={(e) => setClientSearch(e.target.value)}
                                                className="flex-1 border-none focus:ring-0 focus:outline-none"
                                            />
                                            {filteredClient.map(c => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="members"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Members</FormLabel>
                                <FormControl>
                                    <MultiSelect
                                        values={selectedMemberIds}
                                        onValuesChange={(vals) => {
                                            const selected = members
                                                .filter(m => vals.includes(String(m.id)))
                                                .map(m => ({ id: m.id, name: m.name }));

                                            field.onChange(selected);
                                        }}
                                    >
                                        <MultiSelectTrigger className=" w-full hover:bg-white py-2 dark:bg-darkSecondaryBg hover:dark:bg-darkSecondaryBg">
                                            <MultiSelectValue placeholder="Select members..." />
                                        </MultiSelectTrigger>

                                        <MultiSelectContent className="dark:bg-darkSecondaryBg">
                                            <MultiSelectGroup className="dark:bg-darkSecondaryBg">
                                                {members.map(member => (
                                                    <MultiSelectItem
                                                        key={member.id}
                                                        value={String(member.id)}
                                                        className=" px-0 cursor-pointer hover:dark:bg-darkPrimaryBg"
                                                    >
                                                        <Avatar>
                                                            <AvatarImage src={member.image || ""} />
                                                            <AvatarFallback>
                                                                {member.name.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <p>{member.name}</p>
                                                    </MultiSelectItem>
                                                ))}
                                            </MultiSelectGroup>
                                        </MultiSelectContent>
                                    </MultiSelect>
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
                                    <Textarea className="dark:border-darkBorder" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex flex-col md:flex-row gap-4 md:gap-3">
                        {/* Start Date */}
                        <div className="flex-1 flex flex-col justify-start">
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
                                                        className="py-1.5 justify-between font-normal dark:text-darkTextPrimary dark:bg-darkPrimaryBg"
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
                        </div>
                        {/* Deadline Date */}
                        <div className="flex-1 flex flex-col justify-start">
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
                                                        className="py-1.5 justify-between font-normal dark:text-darkTextPrimary dark:bg-darkPrimaryBg"
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
                    </div>

                    {/* <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl className="">
                                    <Input type="text" className="dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary " placeholder="Phone Number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    /> */}
                    <Button className=" w-full" type="submit">Next</Button>
                </form>
            </Form>
        </div >
    );
};

export default EditGeneralInfoStep;