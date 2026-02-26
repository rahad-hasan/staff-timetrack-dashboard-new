/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import InviteMemberIcon from "../Icons/InviteMemberIcon";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { scheduleAssignMemberSchema } from "@/zod/schema";
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
import { useEffect, useState } from "react";
import {
    MultiSelect,
    MultiSelectContent,
    MultiSelectGroup,
    MultiSelectItem,
    MultiSelectTrigger,
    MultiSelectValue,
} from "@/components/ui/multi-select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getMembersDashboard } from "@/actions/members/action";
import { ISchedules } from "@/types/type";
import { toast } from "sonner";
import { assignSchedule } from "@/actions/schedule/action";
import { useDebounce } from "@/hooks/use-debounce";
import { getProjects } from "@/actions/projects/action";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Search } from "lucide-react";
import { Input } from "../ui/input";


type ProjectOption = {
    value: string;
    label: string;
    avatar?: string;
};
const AssignMemberModal = ({ schedule }: { schedule: ISchedules }) => {
    console.log(schedule);
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false);
    const [membersLoading, setMembersLoading] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [members, setMembers] = useState<
        { id: number | string; name: string; email?: string; image?: string }[]
    >([]);

    const form = useForm<z.infer<typeof scheduleAssignMemberSchema>>({
        resolver: zodResolver(scheduleAssignMemberSchema),
        defaultValues: {
            members: [],
        },
    });

    useEffect(() => {
        if (schedule?.scheduleAssigns) {
            const defaultMembers = schedule.scheduleAssigns.map((assign) => ({
                id: assign.user.id,
                name: assign.user.name,
                email: assign.user.email,
                image: assign.user.image || "",
            }));
            setMembers(defaultMembers)
            const defaultIds = defaultMembers.map(m => m.id);
            form.reset({
                members: defaultIds,
            });
        }
    }, [schedule, form]);

    const debouncedSearch = useDebounce(searchInput, 500);
    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            try {
                const res = await getProjects({ search: debouncedSearch, app: true });

                if (res?.success) {
                    setProjects(
                        res.data.map((p: any) => ({
                            value: String(p.id),
                            label: p.name,
                            avatar: p.image || "",
                        }))
                    );
                }
            } catch (err) {
                console.error("Fetch projects error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, [debouncedSearch]);
    const selectedProject = form.watch("project");
    useEffect(() => {
        if (!selectedProject) {
            return;
        }
        const loadMembers = async () => {
            setMembersLoading(true);
            try {
                const res = await getMembersDashboard({ project_id: selectedProject });
                if (res?.success) {
                    const apiMembers = res.data;
                    setMembers([{ id: "all", name: "All", image: "" }, ...apiMembers]);
                }
            } catch (err) {
                console.error("Failed to fetch clients", err);
            } finally {
                setMembersLoading(false);
            }
        };

        loadMembers();
    }, [selectedProject]);

    async function onSubmit(values: z.infer<typeof scheduleAssignMemberSchema>) {
        if (!schedule?.id) {
            toast.error("Invalid schedule");
            return;
        }

        const finalData = {
            schedule_id: schedule.id,
            member_ids: values.members.includes("all") ? "all" : (values.members as number[]),
        };

        setLoading(true);

        try {
            const res = await assignSchedule(finalData);

            if (res?.success) {
                toast.success(res?.message || "Schedules assigned successfully");
                setTimeout(() => {
                    setOpen(false);
                }, 0);
            } else {
                toast.error(res?.message || "Failed to assign schedules", {
                    style: {
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none'
                    },
                });
            }
        } catch (error: any) {
            toast.error(error?.message || "Something went wrong!", {
                style: {
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none'
                },
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <div className="mt-6 pt-6 border-t border-dashed border-borderColor dark:border-darkBorder">
                        <Button onClick={() => setOpen(true)} className="">
                            <InviteMemberIcon size={20} />  Assign Member
                        </Button>
                    </div>
                </DialogTrigger>

                <DialogContent
                    onInteractOutside={(event) => event.preventDefault()}
                    className=" w-full sm:max-w-[525px] max-h-[95vh] overflow-y-auto"
                >
                    <DialogHeader>
                        <DialogTitle className=" mb-4 text-headingTextColor dark:text-darkTextPrimary">
                            Assign Member
                        </DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 ">
                            <FormField
                                control={form.control}
                                name="project"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className={""}>Project</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        // disabled={!selectedAssignee}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full dark:bg-darkSecondaryBg">
                                                    <SelectValue
                                                        placeholder={"Select an assignee first"}
                                                    />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="dark:bg-darkSecondaryBg">
                                                <div className="flex items-center px-2 pb-2 pt-1">
                                                    <Search className="mr-2 h-4 w-4 opacity-50" />
                                                    <Input
                                                        placeholder="Search projects..."
                                                        className="h-8 border-none focus-visible:ring-0"
                                                        value={searchInput}
                                                        onKeyDown={(e) => e.stopPropagation()}
                                                        onChange={(e) => setSearchInput(e.target.value)}
                                                    />
                                                </div>
                                                {projects.length === 0 ? (
                                                    <p className="text-sm text-center py-2">
                                                        {loading ? "Loading..." : "No projects found."}
                                                    </p>
                                                ) : (
                                                    projects.map((p) => (
                                                        <SelectItem key={p.value} value={p.value}>
                                                            <div className="flex items-center gap-2">
                                                                {p.avatar && (
                                                                    <Avatar className="h-4 w-4">
                                                                        <AvatarImage src={p.avatar} />
                                                                        <AvatarFallback className="text-[8px]">P</AvatarFallback>
                                                                    </Avatar>
                                                                )}
                                                                {p.label}
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
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
                                                // values={selectedMemberIds}
                                                values={field.value.map(String)}
                                                onValuesChange={(vals) => {
                                                    let processedValues: (string | number)[];
                                                    const lastSelected = vals[vals.length - 1];

                                                    if (lastSelected === "all") {
                                                        processedValues = ["all"];
                                                    } else {
                                                        const filtered = vals.filter((v) => v !== "all");
                                                        processedValues = filtered.map((v) => Number(v));
                                                    }

                                                    field.onChange(processedValues);
                                                }}
                                            >
                                                <MultiSelectTrigger className=" w-full hover:bg-white py-2 dark:bg-darkSecondaryBg hover:dark:bg-darkSecondaryBg">
                                                    <MultiSelectValue placeholder="Select members..." />
                                                </MultiSelectTrigger>

                                                <MultiSelectContent onWheel={(e) => e.stopPropagation()} className="dark:bg-darkSecondaryBg">
                                                    <MultiSelectGroup className="dark:bg-darkSecondaryBg">
                                                        {members.map((member) => (
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

                            <Button className=" w-full" type="submit" disabled={loading || membersLoading}>
                                {loading ? "Loading..." : "Assign Now"}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default AssignMemberModal;