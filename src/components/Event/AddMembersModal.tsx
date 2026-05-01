/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    MultiSelect,
    MultiSelectContent,
    MultiSelectGroup,
    MultiSelectItem,
    MultiSelectTrigger,
    MultiSelectValue,
} from "@/components/ui/multi-select";
import { addEventMembersSchema } from "@/zod/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import z from "zod";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { addEventMembers } from "@/actions/calendarEvent/action";
import { getMembersDashboard } from "@/actions/members/action";
import { AlertTriangle } from "lucide-react";
import { isConflictResponse, parseConflictMessage } from "./eventHelpers";

type FormValues = z.infer<typeof addEventMembersSchema>;

const AddMembersModal = ({
    handleCloseDialog,
    event,
}: {
    handleCloseDialog: () => void;
    event: any;
}) => {
    const [loading, setLoading] = useState(false);
    const [members, setMembers] = useState<
        { id: number; name: string; image?: string | null }[]
    >([]);
    const [conflicts, setConflicts] = useState<string[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(addEventMembersSchema),
        defaultValues: { members: [] },
    });

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getMembersDashboard();
                if (res?.success) {
                    const assigned = new Set(
                        (event?.eventAssigns ?? []).map((a: any) => a?.user?.id),
                    );
                    setMembers(
                        (res.data ?? []).filter((m: any) => !assigned.has(m.id)),
                    );
                }
            } catch (err) {
                console.error("Failed to fetch members", err);
            }
        };
        load();
    }, [event]);

    const submitWith = async (values: FormValues, force: boolean) => {
        const res = await addEventMembers({
            event_id: event?.id,
            member_ids: values.members.map((v) => Number(v)),
            force_create: force,
        });
        return { ok: !!res?.success, res };
    };

    async function onSubmit(values: FormValues) {
        setLoading(true);
        setConflicts([]);
        try {
            const { ok, res } = await submitWith(values, false);
            if (ok) {
                toast.success(res?.message || "Members added");
                setTimeout(() => handleCloseDialog(), 0);
                return;
            }
            if (isConflictResponse(res)) {
                setConflicts(parseConflictMessage(res?.message));
                return;
            }
            toast.error(res?.message || "Failed to add members", {
                style: { backgroundColor: "#ef4444", color: "white", border: "none" },
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleAddAnyway() {
        setLoading(true);
        try {
            const { ok, res } = await submitWith(form.getValues(), true);
            if (ok) {
                toast.success(res?.message || "Members added");
                setConflicts([]);
                setTimeout(() => handleCloseDialog(), 0);
                return;
            }
            toast.error(res?.message || "Failed to add members", {
                style: { backgroundColor: "#ef4444", color: "white", border: "none" },
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {conflicts.length > 0 && (
                    <div className="rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50/70 dark:bg-red-500/10 p-3 space-y-2">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-300 text-sm font-semibold">
                            <AlertTriangle className="h-4 w-4" />
                            Schedule conflicts detected
                        </div>
                        <ul className="text-[12px] leading-relaxed text-red-700 dark:text-red-300 space-y-1 list-disc pl-5">
                            {conflicts.map((c, i) => (
                                <li key={i}>{c}</li>
                            ))}
                        </ul>
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                            <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={handleAddAnyway}
                                disabled={loading}
                            >
                                Add anyway
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline2"
                                onClick={() => setConflicts([])}
                            >
                                Edit selection
                            </Button>
                        </div>
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="members"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel required>New attendees</FormLabel>
                            <FormControl>
                                <MultiSelect
                                    values={field.value.map(String)}
                                    onValuesChange={(vals) =>
                                        field.onChange(vals.map((v) => Number(v)))
                                    }
                                >
                                    <MultiSelectTrigger className="w-full hover:bg-white py-2 dark:bg-darkPrimaryBg hover:dark:bg-darkPrimaryBg dark:border-darkBorder">
                                        <MultiSelectValue placeholder="Select members to add..." />
                                    </MultiSelectTrigger>
                                    <MultiSelectContent
                                        onWheel={(e) => e.stopPropagation()}
                                        className="dark:bg-darkSecondaryBg"
                                    >
                                        <MultiSelectGroup className="dark:bg-darkSecondaryBg">
                                            {members.length === 0 ? (
                                                <div className="px-3 py-4 text-xs text-subTextColor dark:text-darkTextSecondary text-center">
                                                    All eligible members are already on this event.
                                                </div>
                                            ) : (
                                                members.map((member) => (
                                                    <MultiSelectItem
                                                        key={member.id}
                                                        value={String(member.id)}
                                                        className="px-0 cursor-pointer hover:dark:bg-darkPrimaryBg"
                                                    >
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={member.image || ""} />
                                                            <AvatarFallback>
                                                                {member.name.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <p>{member.name}</p>
                                                    </MultiSelectItem>
                                                ))
                                            )}
                                        </MultiSelectGroup>
                                    </MultiSelectContent>
                                </MultiSelect>
                            </FormControl>
                            <p className="text-[11px] text-subTextColor dark:text-darkTextSecondary">
                                Only newly added attendees receive notifications and sync jobs.
                            </p>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Adding..." : "Add members"}
                </Button>
            </form>
        </Form>
    );
};

export default AddMembersModal;
