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
const AssignMemberModal = ({ schedule }: { schedule: ISchedules }) => {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false);
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
            const defaultIds = defaultMembers.map(m => m.id);
            form.reset({
                members: defaultIds,
            });
        }
    }, [schedule, form]);

    useEffect(() => {
        const loadMembers = async () => {
            setLoading(true);
            try {
                const res = await getMembersDashboard();
                if (res?.success) {
                    const apiMembers = res.data;
                    setMembers([{ id: "all", name: "All", image: "" }, ...apiMembers]);
                }
            } catch (err) {
                console.error("Failed to fetch clients", err);
            } finally {
                setLoading(false);
            }
        };

        loadMembers();
    }, []);

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
                setOpen(false);
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
                    <div className="mt-8 pt-6 border-t border-dashed border-borderColor dark:border-darkBorder">
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

                            <Button className=" w-full" type="submit" disabled={loading}>
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