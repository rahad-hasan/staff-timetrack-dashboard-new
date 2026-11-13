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
import { z } from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { useEffect, useMemo, useState } from "react";
import {
    MultiSelect,
    MultiSelectContent,
    MultiSelectGroup,
    MultiSelectItem,
    MultiSelectTrigger,
    MultiSelectValue,
} from "@/components/ui/multi-select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ISchedules } from "@/types/type";
import { toast } from "sonner";
import { assignSchedule } from "@/actions/schedule/action";
import { actionErrorMessage } from "@/lib/actionErrors";
import { useDebounce } from "@/hooks/use-debounce";
import { useDashboardMembers } from "@/hooks/useDashboardMembers";
import { getProjects } from "@/actions/projects/action";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Search } from "lucide-react";
import { Input } from "../ui/input";


type ProjectOption = {
    value: string;
    label: string;
    avatar?: string;
};

type MemberOption = { id: number | string; name: string; email?: string; image?: string };

const AssignMemberModal = ({ schedule }: { schedule: ISchedules }) => {
    const [open, setOpen] = useState(false)

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

                {/* Mounted per open: the project and member lists are only
                    fetched for a dialog someone opened, and each open starts
                    from the schedule's current assignment. */}
                {open && (
                    <AssignMemberForm schedule={schedule} onDone={() => setOpen(false)} />
                )}
            </Dialog>
        </div>
    );
};

const AssignMemberForm = ({ schedule, onDone }: { schedule: ISchedules; onDone: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const [projects, setProjects] = useState<ProjectOption[]>([]);

    // The submitted list REPLACES the schedule's assignment, so it starts as
    // the people already on it.
    const currentMembers = useMemo<MemberOption[]>(
        () =>
            (schedule?.scheduleAssigns ?? []).map((assign) => ({
                id: assign.user.id,
                name: assign.user.name,
                email: assign.user.email,
                image: assign.user.image || "",
            })),
        [schedule],
    );

    const form = useForm<z.infer<typeof scheduleAssignMemberSchema>>({
        resolver: zodResolver(scheduleAssignMemberSchema),
        defaultValues: {
            members: currentMembers.map((m) => m.id),
        },
    });

    const debouncedSearch = useDebounce(searchInput, 500);

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            try {
                const res = await getProjects({ search: debouncedSearch, app: true });


                if (res?.success) {
                    const mapped = res.data.map((p: any) => ({
                        value: String(p.id),
                        label: p.name,
                        avatar: p.image || "",
                    }));
                    setProjects([
                        { value: "all", label: "All" }, ...mapped,]);
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

    // Picking a project lists that project's members ("All" = everyone).
    const projectId = selectedProject === "all" ? null : selectedProject;
    const projectMembers = useDashboardMembers(projectId, {
        enabled: !!selectedProject,
    });
    // The hook's key for the selected project ("" = everyone): `members` is
    // that project's list only once `loadedFor` says so. Right after a switch
    // it still holds the previous project's, until the new list arrives.
    const projectKey = projectId ? String(projectId) : "";
    const membersReady =
        !!selectedProject && projectMembers.loadedFor === projectKey;
    const membersLoading = !!selectedProject && !membersReady;
    // A failed read sets `loadedFor` too, with an empty list — which read as
    // "this project has no members" and left the replace-all assignment
    // submittable from a list nobody had seen.
    const membersFailed = membersReady && projectMembers.error;

    const availableMembers = useMemo<MemberOption[]>(() => {
        // The selected project's list is not in yet: the options are the
        // current assignees alone. Listing the members on hand meanwhile
        // offered the PREVIOUS project's people under the new one, and
        // "All" selected them too. They then had no option left to untick
        // in the new list, yet were sent with the replace-all assignment.
        if (!membersReady) return currentMembers;
        // The current assignees stay listed after the project's members:
        // they are still selected, and the multi-select renders a selected id
        // that has no option as a blank badge nobody can see — or remove.
        const listed = new Set(projectMembers.members.map((m) => m.id));
        return [
            ...projectMembers.members,
            ...currentMembers.filter((m) => !listed.has(Number(m.id))),
        ];
    }, [membersReady, projectMembers.members, currentMembers]);

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
                    onDone();
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
        } catch (error) {
            toast.error(actionErrorMessage(error, "Something went wrong!"), {
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

    const dedupeIds = (ids: (string | number)[]) =>
        Array.from(new Set(ids.map((x) => Number(x))));

    return (
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
                                <FormLabel required={true} className={""}>Project</FormLabel>
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
                                <FormLabel required={true}>Members</FormLabel>
                                <FormControl>
                                    <MultiSelect

                                        values={field.value.map(String)}
                                        onValuesChange={(vals) => {
                                            const lastSelected = vals[vals.length - 1];

                                            if (lastSelected === "all") {
                                                const currentSelected = form.getValues("members") ?? [];
                                                const allIds = dedupeIds([
                                                    ...currentSelected,
                                                    ...availableMembers.map((m) => m.id),
                                                ]);
                                                field.onChange(allIds);
                                                return;
                                            }

                                            const filtered = vals.filter((v) => v !== "all");
                                            field.onChange(dedupeIds(filtered));
                                        }}
                                    >
                                        <MultiSelectTrigger className=" w-full hover:bg-white py-2 dark:bg-darkSecondaryBg hover:dark:bg-darkSecondaryBg">
                                            <MultiSelectValue placeholder="Select members..." />
                                        </MultiSelectTrigger>

                                        <MultiSelectContent onWheel={(e) => e.stopPropagation()} className="dark:bg-darkSecondaryBg">
                                            {/* Section 1: Special Actions */}
                                            <MultiSelectGroup>
                                                <MultiSelectItem className=" cursor-pointer" value="all">
                                                    <Avatar className="h-6 w-6 mr-2">
                                                        <AvatarImage src={""} />
                                                        <AvatarFallback>A</AvatarFallback>
                                                    </Avatar>
                                                    All
                                                </MultiSelectItem>
                                            </MultiSelectGroup>

                                            {/* Section 2: Already Selected (Optional, for quick reference)
                                            {selectedMembers.length > 0 && (
                                                <MultiSelectGroup className="">
                                                    <p className="text-xs font-semibold px-2 py-1 text-muted-foreground">previously Assigned</p>
                                                    {selectedMembers.map((member) => (
                                                        <MultiSelectItem key={`selected-${member.id}`} value={String(member.id)}>
                                                            <Avatar className="h-6 w-6 mr-2">
                                                                <AvatarImage src={member.image} />
                                                                <AvatarFallback>{member.name[0]}</AvatarFallback>
                                                            </Avatar>
                                                            {member.name}
                                                        </MultiSelectItem>
                                                    ))}
                                                </MultiSelectGroup>
                                            )} */}

                                            {/* Section 3: Available from API */}
                                            <MultiSelectGroup>
                                                <p className="text-xs font-semibold px-2 py-1 text-muted-foreground">Available Members</p>
                                                {membersLoading && (
                                                    <p className="px-2 py-1 text-xs text-muted-foreground">
                                                        Loading the project&apos;s members…
                                                    </p>
                                                )}
                                                {membersFailed && (
                                                    <p className="px-2 py-1 text-xs text-destructive">
                                                        Couldn&apos;t load the project&apos;s members.
                                                    </p>
                                                )}
                                                {availableMembers
                                                    // Optional: Filter out people already in selectedMembers to avoid duplicates
                                                    // .filter(m => !selectedMembers.find(s => s.id === m.id))
                                                    .map((member) => (
                                                        <MultiSelectItem className=" cursor-pointer" key={member.id} value={String(member.id)}>
                                                            <Avatar className="h-6 w-6 mr-2">
                                                                <AvatarImage src={member.image} />
                                                                <AvatarFallback>{member.name[0]}</AvatarFallback>
                                                            </Avatar>
                                                            {member.name}
                                                        </MultiSelectItem>
                                                    ))}
                                            </MultiSelectGroup>
                                        </MultiSelectContent>
                                    </MultiSelect>
                                </FormControl>
                                {/* shown outside the dropdown as well: it is why
                                    "Assign Now" is disabled */}
                                {membersFailed && (
                                    <p role="alert" className="text-destructive text-sm">
                                        Couldn&apos;t load members. Reopen this dialog to try again.
                                    </p>
                                )}
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button className=" w-full" type="submit" disabled={loading || membersLoading || membersFailed}>
                        {loading ? "Loading..." : "Assign Now"}
                    </Button>
                </form>
            </Form>
        </DialogContent>
    );
};

export default AssignMemberModal;