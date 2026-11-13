/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "@/components/ui/button";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { newTaskCreationSchema } from "@/zod/schema";
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
import { useEffect, useMemo, useState } from "react";
import { ChevronDownIcon, Search } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDashboardMembers } from "@/hooks/useDashboardMembers";
import { useDebounce } from "@/hooks/use-debounce";
import { getProjects } from "@/actions/projects/action";
import { editTask } from "@/actions/task/action";
import { actionErrorMessage } from "@/lib/actionErrors";
import { toast } from "sonner";
import { ITask } from "@/types/type";
import { useViewerTimeZone } from "@/components/Common/ViewerTimeZone";
import { instantToPickerDate, pickerDateToInstant } from "@/lib/timezone";
type ProjectOption = {
    value: string;
    label: string;
    avatar?: string;
};
const EditTaskModal = ({ handleCloseDialog, selectedProject }: { handleCloseDialog: () => void; selectedProject: ITask }) => {
    const [loading, setLoading] = useState(false);
    const [taskLoading, setTaskLoading] = useState(false);
    const [projects, setProjects] = useState<ProjectOption[]>([{ value: String(selectedProject.project.id), label: selectedProject.project.name, avatar: '' }]);
    const [memberSearch, setMemberSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [openStartDate, setOpenStartDate] = useState(false);
    // The deadline is an instant: picked, labelled and sent back on the
    // viewer's calendar — the day the task tables show — not the browser's.
    const timeZone = useViewerTimeZone();
    const [dateStartDate, setStartDate] = useState<Date | undefined>(() => instantToPickerDate(selectedProject?.deadline, timeZone));

    const form = useForm<z.infer<typeof newTaskCreationSchema>>({
        resolver: zodResolver(newTaskCreationSchema),
        defaultValues: {
            assignee: String(selectedProject?.user?.id) ?? "",
            project: String(selectedProject?.project_id) ?? "",
            taskName: selectedProject?.name ?? "",
            deadline: instantToPickerDate(selectedProject?.deadline, timeZone) ?? null,
            priority: selectedProject?.priority ?? "",
            details: selectedProject?.description ?? "",
        },
    });

    useEffect(() => {
        if (selectedProject) {
            form.reset({
                assignee: String(selectedProject?.user?.id) ?? "",
                project: String(selectedProject?.project_id) ?? "",
                taskName: selectedProject?.name ?? "",
                deadline: instantToPickerDate(selectedProject?.deadline, timeZone) ?? null,
                priority: selectedProject?.priority ?? "",
                details: selectedProject?.description ?? "",
            });
            setProjects([{
                value: String(selectedProject.project.id),
                label: selectedProject.project.name,
                avatar: ""
            }]);
            setMemberSearch("");
            setSearchInput("");
            setOpenStartDate(false);
            setStartDate(instantToPickerDate(selectedProject?.deadline, timeZone));
        }
    }, [form, selectedProject, timeZone]);

    // const selectedAssignee = form.watch("assignee");
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

    const watchedProjectId = form.watch("project");
    const projectKey = watchedProjectId ? String(watchedProjectId) : "";
    const originalProjectKey = String(selectedProject?.project_id);

    const projectMembers = useDashboardMembers(watchedProjectId, { enabled: !!watchedProjectId });
    // True once `projectMembers.members` belongs to the project now selected —
    // never to one the user has already switched away from.
    const membersCurrent = projectKey !== "" && projectMembers.loadedFor === projectKey;

    const members = useMemo(() => {
        const assignee = {
            id: selectedProject.user.id,
            name: selectedProject.user.name,
            image: selectedProject.user.image ?? "",
        };
        // Until the selected project's members arrive, offer the task's own
        // assignee so the field isn't blank.
        if (!membersCurrent) return [assignee];
        // On the task's own project, keep its assignee selectable even when
        // /dashboard/members (active users only) leaves them out — a value
        // with no matching option renders as an empty field.
        if (
            projectKey === originalProjectKey &&
            !projectMembers.members.some((m) => m.id === assignee.id)
        ) {
            return [assignee, ...projectMembers.members];
        }
        return projectMembers.members;
    }, [membersCurrent, projectKey, originalProjectKey, projectMembers.members, selectedProject.user]);

    const filteredMembers = useMemo(
        () => members.filter(m => m.name.toLowerCase().includes(memberSearch.toLowerCase())),
        [members, memberSearch]
    );

    // Once the selected project's members are in: back on the task's own
    // project the original assignee is restored, on any other project the
    // assignee is cleared (they may not belong to it).
    useEffect(() => {
        if (!membersCurrent) return;
        if (projectKey !== originalProjectKey) {
            form.setValue("assignee", "");
        } else {
            form.setValue("assignee", String(selectedProject?.user?.id) ?? "");
        }
    }, [membersCurrent, projectKey, originalProjectKey, form, selectedProject?.user?.id]);

    async function onSubmit(values: z.infer<typeof newTaskCreationSchema>) {
        const finalData = {
            name: values.taskName,
            project_id: Number(values.project),
            assignee: Number(values.assignee),
            // An untouched deadline goes back as exactly the instant it came from.
            deadline: values.deadline ? pickerDateToInstant(values.deadline, timeZone, selectedProject?.deadline).toISOString() : null,
            priority: values.priority,
            ...(values.details && { description: values.details }),
        }
        setTaskLoading(true);
        try {
            const res = await editTask({ data: finalData, id: selectedProject?.id });

            if (res?.success) {
                form.reset();
                setTimeout(() => {
                    handleCloseDialog();
                }, 0);
                toast.success(res?.message || "Task updated successfully");
            } else {
                toast.error(res?.message || "Failed to update task", {
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
            setTaskLoading(false);
        }
    }

    return (
        <DialogContent
            onInteractOutside={(event) => event.preventDefault()}
            className="w-full sm:max-w-[525px] max-h-[95vh] overflow-y-auto"
        >
            <DialogHeader>
                <DialogTitle className="mb-4">Edit Task</DialogTitle>
            </DialogHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="project"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel required={true} className={""}>Project</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full dark:bg-darkSecondaryBg">
                                            <SelectValue
                                                placeholder={"Select project"}
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
                        name="assignee"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel required={true}>Assignee</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-full dark:bg-darkSecondaryBg">
                                            <SelectValue placeholder="Select a member" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="dark:bg-darkSecondaryBg">
                                        <div className="flex items-center px-2 pb-2 pt-1">
                                            <Search className="mr-2 h-4 w-4 opacity-50" />
                                            <Input
                                                placeholder="Search members..."
                                                className="h-8 border-none focus-visible:ring-0"
                                                value={memberSearch}
                                                // second click stop solution
                                                onKeyDown={(e) => e.stopPropagation()}
                                                onChange={(e) => setMemberSearch(e.target.value)}
                                            />
                                        </div>
                                        {filteredMembers.length === 0 ? (
                                            <p className="text-xs text-center py-2 text-muted-foreground">No members found.</p>
                                        ) : (
                                            filteredMembers.map((member) => (
                                                <SelectItem
                                                    key={member.id}
                                                    value={String(member.id)}
                                                    className="cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={member.image || ""} />
                                                            <AvatarFallback className="text-[10px]">
                                                                {member.name.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span>{member.name}</span>
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
                        name="taskName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel required={true}>Task Name</FormLabel>
                                <FormControl>
                                    <Input className="dark:bg-darkPrimaryBg dark:border-darkBorder" placeholder="Task Name" {...field} />
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
                                <FormLabel required={true}>Deadline</FormLabel>
                                <FormControl>
                                    <Popover open={openStartDate} onOpenChange={setOpenStartDate}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline2"
                                                id="startDate"
                                                className="py-1.5 justify-between font-normal dark:bg-darkPrimaryBg dark:border-darkBorder dark:text-darkTextPrimary"
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
                        name="priority"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel required={true}>Priority</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full dark:bg-darkSecondaryBg">
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="dark:bg-darkSecondaryBg">
                                        <SelectItem value="low" className="cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-blue-500" />
                                                Low
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="medium" className="cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-yellow-500" />
                                                Medium
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="high" className="cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-red-500" />
                                                High
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
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
                                    <Textarea className="dark:bg-darkPrimaryBg dark:border-darkBorder" placeholder="Task Details" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button className="w-full" type="submit" disabled={taskLoading}>{taskLoading ? "Loading..." : "Update Task"}</Button>
                </form>
            </Form>
        </DialogContent>
    );
};

export default EditTaskModal;
