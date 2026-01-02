"use client";
import { Switch } from "@/components/ui/switch"
import { leaveSettingsSchema } from "@/zod/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@radix-ui/react-select";
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
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ICompany } from "@/types/type";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

const Configuration = ({ data }: { data: ICompany }) => {
    const daysOfWeek = [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    ];
    const form = useForm<z.infer<typeof leaveSettingsSchema>>({
        resolver: zodResolver(leaveSettingsSchema),
        defaultValues: {
            paid_leave: data?.paid_leave || 0,
            casual_leave: data?.casual_leave || 0,
            sick_leave: data?.sick_leave || 0,
            maternity_leave: data?.maternity_leave || 0,
            address: data?.address || "",
            time_zone: data?.time_zone || "",
            idle_minutes_limit: data?.idle_minutes_limit || 10,
            week_start: data?.week_start || "Monday",
        },
    });

    function onSubmit(values: z.infer<typeof leaveSettingsSchema>) {
        console.log(values);
    }

    return (
        <div className="xl:w-[80%] rounded-lg border border-borderColor p-3 md:p-4 mt-4 bg-white dark:bg-darkSecondaryBg dark:border-darkBorder">
            {/* <h2 className="text-lg font-medium mb-6 text-textGray dark:text-darkTextPrimary">Notifications Preferences</h2> */}

            <div className={`rounded-md border border-borderColor dark:border-darkBorder p-3 md:p-4 mb-4`}>
                <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
                    <span className="text-subTextColor dark:text-darkTextPrimary">Notification Configuration</span>
                    <div className="flex gap-8 text-headingTextColor dark:text-darkTextPrimary">
                        <span>IN-APP</span>
                        <span>EMAIL</span>
                    </div>
                </div>

                <Separator className="mb-3" />

                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm text-headingTextColor dark:text-darkTextPrimary">
                        <span className="flex-1">Notifications Preferences</span>
                        <div className="flex items-center gap-8">
                            <Switch defaultChecked={data?.app_notify} />
                            <Switch defaultChecked={data?.email_notify} />
                        </div>
                    </div>
                </div>
            </div>

            <div className={`rounded-md border border-borderColor dark:border-darkBorder p-3 md:p-4 mb-4`}>
                <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
                    <span className="text-subTextColor dark:text-darkTextPrimary">URL Tracking Configuration</span>
                    <div className="flex gap-8 text-headingTextColor dark:text-darkTextPrimary">
                        <span>URL Tracking</span>
                    </div>
                </div>
                <Separator className="mb-3" />
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm text-headingTextColor dark:text-darkTextPrimary">
                        <span className="flex-1">URL Tracking Preferences</span>
                        <div className="flex items-center gap-8">
                            <Switch defaultChecked={data?.url_tracking_enabled} />
                        </div>
                    </div>
                </div>
            </div>

            <div className={`rounded-md border border-borderColor dark:border-darkBorder p-3 md:p-4  mb-4`}>
                <span className="text-subTextColor dark:text-darkTextPrimary  text-sm font-medium ">Leave Configuration</span>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-4 sm:gap-3 items-start">

                            {/* Paid Leave */}
                            <FormField
                                control={form.control}
                                name="paid_leave"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Paid Leave</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Paid Leave"
                                                className="dark:bg-darkPrimaryBg dark:border-darkBorder"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Casual Leave */}
                            <FormField
                                control={form.control}
                                name="casual_leave"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Casual Leave</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Casual Leave"
                                                className="dark:bg-darkPrimaryBg dark:border-darkBorder"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Second Row */}
                        <div className="grid grid-cols-2 gap-4 sm:gap-3 items-start">

                            {/* Sick Leave */}
                            <FormField
                                control={form.control}
                                name="sick_leave"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Sick Leave</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Sick Leave"
                                                className="dark:bg-darkPrimaryBg dark:border-darkBorder"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Maternity Leave */}
                            <FormField
                                control={form.control}
                                name="maternity_leave"
                                render={({ field }) => (
                                    <FormItem className="w-full">
                                        <FormLabel>Maternity Leave</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="Maternity Leave"
                                                className="dark:bg-darkPrimaryBg dark:border-darkBorder"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Buttons */}
                        {/* <div className="flex items-center gap-3 w-full pt-3">
                            <Button type="submit">Save Changes</Button>
                            <Button
                                variant="outline2"
                                className="dark:bg-darkPrimaryBg dark:border-darkBorder dark:text-darkTextPrimary"
                            >
                                Cancel
                            </Button>
                        </div> */}
                    </form>
                </Form>
            </div>


            <div className={`rounded-md border border-borderColor dark:border-darkBorder p-3 md:p-4 mb-4`}>
                <span className="text-subTextColor dark:text-darkTextPrimary text-sm font-medium ">Others Configuration</span>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">

                        <div className="grid grid-cols-2 gap-4 sm:gap-3 items-start">
                            {/* Address */}
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Address</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Enter address"
                                                className="dark:bg-darkPrimaryBg dark:border-darkBorder"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Time Zone */}
                            <FormField
                                control={form.control}
                                name="time_zone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Time Zone</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. Asia/Dhaka"
                                                className="dark:bg-darkPrimaryBg dark:border-darkBorder"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:gap-3 items-start">
                            {/* Idle Minutes Limit */}
                            <FormField
                                control={form.control}
                                name="idle_minutes_limit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Idle Minutes Limit</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                className="dark:bg-darkPrimaryBg dark:border-darkBorder"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Week Start Selector */}
                            <div className=" w-full">
                                <FormField
                                    control={form.control}
                                    name="week_start"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Week Start Day</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl className=" w-full">
                                                    <SelectTrigger className="dark:bg-darkPrimaryBg dark:border-darkBorder">
                                                        <SelectValue placeholder="Select start day" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {daysOfWeek.map((day) => (
                                                        <SelectItem key={day} value={day}>{day}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full pt-3 border-t dark:border-darkBorder">
                            <Button type="submit">Save Changes</Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default Configuration;