/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { useState } from "react";
import { toast } from "sonner";
import { updateCompanyInfo } from "@/actions/settings/action";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

const Configuration = ({ data }: { data: ICompany }) => {
    const [loading, setLoading] = useState(false);
    const daysOfWeek = [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    ];
    const popularTimeZones = [
        // Americas
        { label: "(GMT-08:00) Pacific Time (US & Canada)", value: "America/Los_Angeles" },
        { label: "(GMT-07:00) Mountain Time (US & Canada)", value: "America/Denver" },
        { label: "(GMT-06:00) Central Time (US & Canada)", value: "America/Chicago" },
        { label: "(GMT-05:00) Eastern Time (US & Canada)", value: "America/New_York" },
        { label: "(GMT-04:00) Atlantic Time (Canada)", value: "America/Halifax" },
        { label: "(GMT-03:00) Brazil (Sao Paulo)", value: "America/Sao_Paulo" },

        // Europe & Africa
        { label: "(GMT+00:00) Western European Time (London)", value: "Europe/London" },
        { label: "(GMT+01:00) Central European Time (Paris, Berlin)", value: "Europe/Paris" },
        { label: "(GMT+02:00) Eastern European Time (Cairo, Helsinki)", value: "Europe/Cairo" },
        { label: "(GMT+02:00) South Africa Standard Time", value: "Africa/Johannesburg" },
        { label: "(GMT+03:00) Moscow Standard Time", value: "Europe/Moscow" },
        { label: "(GMT+03:00) East Africa Time (Nairobi)", value: "Africa/Nairobi" },

        // Middle East & Asia
        { label: "(GMT+03:00) Arabia Standard Time (Riyadh)", value: "Asia/Riyadh" },
        { label: "(GMT+03:30) Iran Standard Time", value: "Asia/Tehran" },
        { label: "(GMT+04:00) Gulf Standard Time (Dubai)", value: "Asia/Dubai" },
        { label: "(GMT+05:00) Pakistan Standard Time (Karachi)", value: "Asia/Karachi" },
        { label: "(GMT+05:30) India Standard Time (Kolkata)", value: "Asia/Kolkata" },
        { label: "(GMT+06:00) Bangladesh Standard Time", value: "Asia/Dhaka" },
        { label: "(GMT+07:00) Indochina Time (Bangkok, Jakarta)", value: "Asia/Bangkok" },
        { label: "(GMT+08:00) China Standard Time (Beijing)", value: "Asia/Shanghai" },
        { label: "(GMT+08:00) Singapore / Malaysia", value: "Asia/Singapore" },
        { label: "(GMT+09:00) Japan / Korea Standard Time", value: "Asia/Tokyo" },

        // Australia & Pacific
        { label: "(GMT+08:00) Western Australia (Perth)", value: "Australia/Perth" },
        { label: "(GMT+09:30) Central Australia (Darwin)", value: "Australia/Darwin" },
        { label: "(GMT+10:00) Eastern Australia (Sydney)", value: "Australia/Sydney" },
        { label: "(GMT+12:00) New Zealand (Auckland)", value: "Pacific/Auckland" },
    ];
    const [switches, setSwitches] = useState({
        app_notify: data?.app_notify || false,
        email_notify: data?.email_notify || false,
        url_tracking_enabled: data?.url_tracking_enabled || false,
    });
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


    async function onSubmit(values: z.infer<typeof leaveSettingsSchema>) {
        const finalData = {
            ...values,
            // name: data?.name,
            // email: data?.email,
            // phone: data?.phone,
            ...switches
        }
        setLoading(true);
        try {
            const res = await updateCompanyInfo({ data: finalData, id: data?.id });

            if (res?.success) {
                toast.success(res?.message || "Updated company info successfully");
            } else {
                toast.error(res?.message || "Failed to update", {
                    style: {
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none'
                    },
                });
            }
        } catch (error: any) {
            console.error("failed:", error);
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
                            <Switch
                                checked={switches.app_notify}
                                onCheckedChange={(val) => setSwitches(prev => ({ ...prev, app_notify: val }))}
                            />
                            <Switch
                                checked={switches.email_notify}
                                onCheckedChange={(val) => setSwitches(prev => ({ ...prev, email_notify: val }))}
                            />
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
                            <Switch
                                checked={switches.url_tracking_enabled}
                                onCheckedChange={(val) => setSwitches(prev => ({ ...prev, url_tracking_enabled: val }))}
                            />
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
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Time Zone</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline2"
                                                        role="combobox"
                                                        className=" flex justify-between dark:text-darkTextPrimary hover:dark:bg-darkPrimaryBg"
                                                    >
                                                        <span className="truncate">
                                                            {field.value
                                                                ? popularTimeZones.find((tz) => tz.value === field.value)?.label
                                                                : "Select time zone"}
                                                        </span>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 dark:bg-darkSecondaryBg dark:border-darkBorder ">
                                                <Command className="dark:bg-darkSecondaryBg">
                                                    <CommandInput placeholder="Search time zone..." className="" />
                                                    <CommandList className="overflow-y-scroll no-scrollbar scroll-smooth">
                                                        <CommandEmpty>No time zone found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {popularTimeZones.map((tz) => (
                                                                <CommandItem
                                                                    key={tz.value}
                                                                    value={tz.label}
                                                                    onSelect={() => {
                                                                        form.setValue("time_zone", tz.value);
                                                                        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                                                                    }}
                                                                    className="cursor-pointer hover:dark:bg-darkPrimaryBg"
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            tz.value === field.value ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {tz.label}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
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
                                                <SelectContent className=" dark:border-darkBorder">
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
                            <Button type="submit" disabled={loading}>{loading ? "Loading..." : "Save Changes"}</Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default Configuration;