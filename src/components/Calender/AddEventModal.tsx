/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { Button } from "@/components/ui/button";
import {
    // DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { addNewEventSchema } from "@/zod/schema";
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
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { CalendarDays, ChevronDownIcon, } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
    MultiSelect,
    MultiSelectContent,
    MultiSelectGroup,
    MultiSelectItem,
    MultiSelectTrigger,
    MultiSelectValue,
} from "@/components/ui/multi-select"
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getMembersDashboard } from "@/actions/members/action";
import { addEvent } from "@/actions/calendarEvent/action";
import ClockIcon from "../Icons/ClockIcon";

const AddEventModal = ({ onClose }: { onClose: () => void }) => {

    const [members, setMembers] = useState<{ id: number; name: string; image?: string }[]>([]);
    const [loading, setLoading] = useState(false);

    const [openStartDate, setOpenStartDate] = useState(false);
    const [dateStartDate, setStartDate] = useState<Date | undefined>(undefined);

    const form = useForm<z.infer<typeof addNewEventSchema>>({
        resolver: zodResolver(addNewEventSchema),
        defaultValues: {
            eventName: "",
            project: "",
            time: "01:00:00",
            members: [],
            meetingLink: "",
            description: "",
        },
    })

    useEffect(() => {
        const loadMembers = async () => {
            setLoading(true);
            try {
                const res = await getMembersDashboard();
                if (res?.success) {
                    const apiMembers = res.data;
                    setMembers([
                        { id: "all", name: "All", image: "" },
                        ...apiMembers
                    ])
                }

            } catch (err) {
                console.error("Failed to fetch clients", err);
            } finally {
                setLoading(false);
            }
        };

        loadMembers();
    }, []);

    async function onSubmit(values: z.infer<typeof addNewEventSchema>) {

        const combinedDateTime = new Date(values.date);

        const [hours, minutes, seconds] = values.time.split(":").map(Number);

        combinedDateTime.setHours(hours || 0);
        combinedDateTime.setMinutes(minutes || 0);
        combinedDateTime.setSeconds(seconds || 0);


        const finalData = {
            name: values?.eventName,
            note: values?.description,
            date: combinedDateTime.toISOString(),
            force_create: false,
            member_ids: values?.members.includes("all") ? "all" : values?.members,
            ...(values?.meetingLink && { meeting_link: values.meetingLink })
        }
        console.log(finalData);

        setLoading(true);
        try {
            const res = await addEvent(finalData);
            console.log("success:", res);

            if (res?.success) {
                toast.success(res?.message || "Event added successfully");
                form.reset();
                setStartDate(undefined);
                setTimeout(() => {
                    onClose();
                }, 0);
            } else {
                toast.error(res?.message || "Failed to add event");
            }
        } catch (error: any) {
            console.error("failed:", error);
            toast.error(error.message || "Something went wrong!");
        } finally {
            setLoading(false);
        }
    }

    return (
        <DialogContent
            onInteractOutside={(event) => event.preventDefault()}
            className=" w-full sm:max-w-[525px] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className=" mb-4 text-headingTextColor dark:text-darkTextPrimary">Add Event</DialogTitle>
            </DialogHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 ">
                    <FormField
                        control={form.control}
                        name="eventName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Event name</FormLabel>
                                <FormControl>
                                    <Input type="text" className="dark:bg-darkPrimaryBg dark:border-darkBorder" placeholder="Event name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="w-full">
                                <FormLabel>Event Date</FormLabel>
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
                    <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                            <FormItem className=" w-full">
                                <FormControl className="">
                                    <div className='relative '>
                                        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
                                            <ClockIcon size={16} className=" text-headingTextColor dark:text-darkTextPrimary" />
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
                    {/* <FormField
                        control={form.control}
                        name="project"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Add Project (optional)</FormLabel>
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
                    /> */}
                    {/* <FormField
                        control={form.control}
                        name="members"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Members</FormLabel>
                                <FormControl>
                                    <MultiSelect
                                        values={field.value}
                                        onValuesChange={field.onChange}
                                    >
                                        <MultiSelectTrigger className=" w-full hover:bg-white dark:bg-darkPrimaryBg hover:dark:bg-darkPrimaryBg dark:border-darkBorder py-2">
                                            <MultiSelectValue placeholder="Select Team Members..." />
                                        </MultiSelectTrigger>
                                        <MultiSelectContent className="dark:bg-darkSecondaryBg">
                                            <MultiSelectGroup className="dark:bg-darkSecondaryBg">
                                                {
                                                    memberData?.map((member, i) => (

                                                        <MultiSelectItem className=" px-0 cursor-pointer" key={i} value={member?.name}>
                                                            <Image src={member?.image} className=" w-8" width={200} height={200} alt="profile_image" />
                                                            <p>{member?.name}</p>
                                                        </MultiSelectItem>
                                                    ))
                                                }

                                            </MultiSelectGroup>
                                        </MultiSelectContent>
                                    </MultiSelect>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    /> */}

                    <FormField
                        control={form.control}
                        name="members"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Members</FormLabel>
                                <FormControl>
                                    <MultiSelect
                                        // values={selectedMemberIds}
                                        values={field.value.map(String)}
                                        onValuesChange={(vals) => {
                                            let processedValues: (string | number)[];
                                            const lastSelected = vals[vals.length - 1];

                                            if (lastSelected === "all") {
                                                processedValues = ["all"];
                                            } else {
                                                const filtered = vals.filter(v => v !== "all");
                                                processedValues = filtered.map(v => Number(v));
                                            }

                                            field.onChange(processedValues);
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
                        name="meetingLink"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Meeting Link</FormLabel>
                                <FormControl>
                                    <Input type="url" className="dark:bg-darkPrimaryBg dark:border-darkBorder" placeholder="Meeting Link (Optional)" {...field} />
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
                                    <Textarea className="dark:border-darkBorder" placeholder="Enter description" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button className=" w-full" type="submit" disabled={loading}>{loading ? "Loading..." : "Create Event"}</Button>
                </form>
            </Form>
        </DialogContent>
    );
};

export default AddEventModal;