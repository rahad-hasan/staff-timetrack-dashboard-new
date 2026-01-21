/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { Button } from "@/components/ui/button";
import {
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { leaveRejectRequestSchema } from "@/zod/schema";
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
import { Textarea } from "@/components/ui/textarea";
import { ILeaveRequest } from "@/types/type";
import { useState } from "react";
import { toast } from "sonner";
import { approveRejectLeave } from "@/actions/leaves/action";

const RejectLeaveRequestModal = ({ data }: { data: ILeaveRequest }) => {
    console.log(data);
    const userId = data?.id
    const [loading, setLoading] = useState(false);
    const form = useForm<z.infer<typeof leaveRejectRequestSchema>>({
        resolver: zodResolver(leaveRejectRequestSchema),
        defaultValues: {
            reason: "",
        },
    });

    async function onSubmit(values: z.infer<typeof leaveRejectRequestSchema>) {
        setLoading(true);
        try {
            const res = await approveRejectLeave({
                data: {
                    leave_id: userId,
                    approved: false,
                    reject_reason: values?.reason
                }
            });

            if (res?.success) {
                toast.success(res?.message || "Request rejected successfully");
            } else {
                toast.error(res?.message || "Failed to rejected request");
            }
        } catch (error: any) {
            toast.error(error.message || "Something went wrong!");
        } finally {
            setLoading(false);
        }
    }

    return (
        <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
                <DialogTitle className="mb-4">Leave request</DialogTitle>
            </DialogHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                    <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Reason</FormLabel>
                                <FormControl>
                                    <Textarea className="border-borderColor dark:border-darkBorder" placeholder="Type Reason" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex items-center gap-3 w-full">
                        <DialogClose asChild>
                            <Button className="dark:border-darkBorder dark:text-darkTextPrimary" variant="outline2">Cancel</Button>
                        </DialogClose>
                        <Button className="bg-red-500 hover:bg-red-500 dark:text-darkTextPrimary" disabled={loading} type="submit">{loading ? "Loading..." : "Reject Request"}</Button>
                    </div>
                </form>
            </Form>
        </DialogContent>
    );
};

export default RejectLeaveRequestModal;