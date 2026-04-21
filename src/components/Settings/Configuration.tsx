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
import { popularTimeZoneList } from "@/utils/TimeZoneList";
import { useLogInUserStore } from "@/store/logInUserStore";

const Configuration = ({ data }: { data: ICompany }) => {
    const [loading, setLoading] = useState(false);
    const daysOfWeek = [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    ];
    const { updateUserData } = useLogInUserStore();

    const [switches, setSwitches] = useState({
        app_notify: data?.app_notify || false,
        email_notify: data?.email_notify || false,
        url_tracking_enabled: data?.url_tracking_enabled || false,
    });
    const form = useForm<z.infer<typeof leaveSettingsSchema>>({
        resolver: zodResolver(leaveSettingsSchema),
        defaultValues: {
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
                updateUserData({
                    timezone: values.time_zone,
                });
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
                <div className="mt-3 rounded-2xl border border-dashed border-borderColor bg-bgSecondary/60 px-4 py-5 text-sm text-subTextColor dark:border-darkBorder dark:bg-darkPrimaryBg">
                    Leave limits are no longer configured from company settings. Manage tenant leave policies from the read-only <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">Leave Types</span> screen until the dedicated CRUD API is available.
                </div>
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
                                        <FormLabel required={true}>Address</FormLabel>
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
                                        <FormLabel required={true}>Time Zone</FormLabel>
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
                                                                ? popularTimeZoneList.find((tz) => tz.value === field.value)?.label
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
                                                            {popularTimeZoneList.map((tz) => (
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
                                        <FormLabel required={true}>Idle Minutes Limit</FormLabel>
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
                                            <FormLabel required={true}>Week Start Day</FormLabel>
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
