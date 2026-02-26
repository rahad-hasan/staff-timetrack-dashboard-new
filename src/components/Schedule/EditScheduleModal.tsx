/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { Button } from "@/components/ui/button";
import {
    // DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScheduleShiftSchema } from "@/zod/schema";
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
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import ClockIcon from "../Icons/ClockIcon";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner";
import { editSchedule } from "@/actions/schedule/action";
import { ISchedules } from "@/types/type";
import { convertTo24Hour } from "@/utils";

interface EditNewMemberModalProps {
    onClose: () => void
    selectedSchedule: ISchedules
}
const EditScheduleModal = ({ onClose, selectedSchedule }: EditNewMemberModalProps) => {
    const [loading, setLoading] = useState(false);
    const [isAllowOvertime, setIsAllowOvertime] = useState(selectedSchedule?.allow_overtime || false);

    const form = useForm<z.infer<typeof ScheduleShiftSchema>>({
        resolver: zodResolver(ScheduleShiftSchema),
        defaultValues: {
            name: selectedSchedule?.name,
            start_time: convertTo24Hour(selectedSchedule.start_time_local),
            end_time: convertTo24Hour(selectedSchedule.end_time_local),
            grace_in_min: selectedSchedule?.grace_in_min,
            grace_out_min: selectedSchedule?.grace_out_min,
            break_in_min: selectedSchedule?.break_in_min,
        },
    })
    useEffect(() => {
        if (selectedSchedule) {
            form.reset({
                name: selectedSchedule?.name,
                start_time: convertTo24Hour(selectedSchedule.start_time_local),
                end_time: convertTo24Hour(selectedSchedule.end_time_local),
                grace_in_min: selectedSchedule?.grace_in_min,
                grace_out_min: selectedSchedule?.grace_out_min,
                break_in_min: selectedSchedule?.break_in_min,
            });
        }
    }, [selectedSchedule, form]);

    async function onSubmit(values: z.infer<typeof ScheduleShiftSchema>) {
        const finalData = {
            name: values.name,
            start_time: values.start_time,
            end_time: values.end_time,
            grace_in_min: values.grace_in_min,
            grace_out_min: values.grace_out_min,
            break_in_min: values.break_in_min,
            ...(isAllowOvertime && { allow_overtime: isAllowOvertime })
        }
        setLoading(true);
        try {
            const res = await editSchedule({ data: finalData, id: selectedSchedule.id });

            if (res?.success) {
                form.reset();
                setTimeout(() => {
                    onClose();
                }, 0);
                toast.success(res?.message || "Schedule updated successfully");
            } else {
                toast.error(res?.message || "Failed to update schedule", {
                    style: {
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none'
                    },
                });
            }
        } catch (error: any) {
            toast.error(error.message || "Something went wrong!", {
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
        <DialogContent className="sm:max-w-[525px] max-h-[95vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle className=" mb-4">Edit Schedule</DialogTitle>
            </DialogHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 ">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel required={true}>Name</FormLabel>
                                <FormControl>
                                    <Input type="text" className="dark:bg-darkPrimaryBg dark:border-darkBorder " placeholder="Schedule name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="start_time"
                        render={({ field }) => (
                            <FormItem className=" w-full">
                                <FormLabel required={true}>Shift Start Time</FormLabel>
                                <FormControl className="">
                                    <div className='relative '>
                                        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
                                            <ClockIcon size={16} className=" text-headingTextColor dark:text-darkTextPrimary" />
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
                    <FormField
                        control={form.control}
                        name="end_time"
                        render={({ field }) => (
                            <FormItem className=" w-full">
                                <FormLabel required={true}>Shift End Time</FormLabel>
                                <FormControl className="">
                                    <div className='relative '>
                                        <div className='text-muted-foreground pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 peer-disabled:opacity-50'>
                                            <ClockIcon size={16} className=" text-headingTextColor dark:text-darkTextPrimary" />
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
                    <FormField
                        control={form.control}
                        name="grace_in_min"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel required={true}>Grace In Minutes</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        className="dark:bg-darkPrimaryBg dark:border-darkBorder" placeholder="10 means 10 minutes"
                                        onChange={(e) =>
                                            field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                                        }
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="grace_out_min"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel required={true}>Grace Out Minutes</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        className="dark:bg-darkPrimaryBg dark:border-darkBorder" placeholder="10 means 10 minutes"
                                        onChange={(e) =>
                                            field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                                        }
                                    />

                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="break_in_min"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel required={true}>Break In Minutes</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        className="dark:bg-darkPrimaryBg dark:border-darkBorder" placeholder="10 means 10 minutes"
                                        onChange={(e) =>
                                            field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                                        }
                                    />

                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex gap-2 items-center mb-5">
                        <Checkbox
                            id="allow_overtime"
                            className="cursor-pointer border-primary"
                            checked={isAllowOvertime}
                            onCheckedChange={(checked) => setIsAllowOvertime(!!checked)}
                        />
                        <label
                            htmlFor="allow_overtime"
                            className="cursor-pointer text-sm font-medium -mb-0.5"
                        >
                            Allow Overtime
                        </label>
                    </div>
                    <Button disabled={loading} className=" w-full" type="submit">{loading ? "Loading..." : "Update"}</Button>
                </form>
            </Form>
        </DialogContent>
    );
};

export default EditScheduleModal;