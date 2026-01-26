/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SingleMemberProjectTable from "./SingleMemberProjectTable";
import SingleMemberTaskTable from "./SingleMemberTaskTable";


// Define a schema locally for the member data
const memberSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().optional().nullable(),
    pay_rate_hourly: z.number().min(0),
});

const SingleMemberPage = ({ data }: { data: any }) => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"Projects" | "Tasks">("Projects");
    const handleTabClick = (tab: "Projects" | "Tasks") => {
        setActiveTab(tab);
    };

    // State for the Boolean switches
    const [switches, setSwitches] = useState({
        is_active: data?.is_active ?? true,
        is_tracking: data?.is_tracking ?? true,
        url_tracking: data?.url_tracking ?? true,
        cam_tracking: data?.cam_tracking ?? false,
        multi_factor_auth: data?.multi_factor_auth ?? false,
    });

    const form = useForm<z.infer<typeof memberSchema>>({
        resolver: zodResolver(memberSchema),
        defaultValues: {
            name: data?.name || "",
            email: data?.email || "",
            phone: data?.phone || "",
            pay_rate_hourly: data?.pay_rate_hourly || 0,
        },
    });

    const onSubmit = async (values: z.infer<typeof memberSchema>) => {
        setLoading(true);
        const finalData = {
            ...values,
            ...switches,
            id: data.id,
        };

        // Showing the data in console and toast as requested
        console.log("Final Member Data for Update:", finalData);

        setTimeout(() => {
            toast.success("Check console for updated data object!");
            setLoading(false);
        }, 1000);
    };

    return (
        <div>
            <div className="flex items-center gap-4 bg-gradient-to-r from-primary  to-[#7a06ffe1] p-2 rounded-full shadow-lg">
                <Avatar className="w-16 h-16 ">
                    <AvatarImage
                        src={data?.image}
                        alt={data?.name}
                        className="object-cover rounded-full"
                    />
                    <AvatarFallback className="text-xl font-bold">{data?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-2xl font-semibold text-white">{data?.name}</p>
            </div>

            <div className="xl:w-[80%] rounded-lg border border-borderColor p-3 md:p-4 mt-4 bg-white dark:bg-darkSecondaryBg dark:border-darkBorder">

                {/* Status & Tracking Switches Section */}
                <div className="rounded-md border border-borderColor dark:border-darkBorder p-3 md:p-4 mb-4">
                    <div className="flex justify-between items-center text-sm font-medium text-gray-500 mb-2">
                        <span className="text-subTextColor dark:text-darkTextPrimary">Account & Permissions</span>
                        <span className="text-headingTextColor dark:text-darkTextPrimary text-xs font-bold uppercase">Status</span>
                    </div>

                    <div className="space-y-4">
                        {/* Item 1: Active Status */}
                        <div className="flex justify-between items-center text-sm text-headingTextColor dark:text-darkTextPrimary">
                            <div className="flex flex-col">
                                <span className="font-medium">Active Account</span>
                                <span className="text-xs text-subTextColor dark:text-darkTextSecondary">Allow member to log in and access the system</span>
                            </div>
                            <Switch
                                checked={switches.is_active}
                                onCheckedChange={(val) => setSwitches(prev => ({ ...prev, is_active: val }))}
                            />
                        </div>

                        {/* Item 2: Tracking Status */}
                        <div className="flex justify-between items-center text-sm text-headingTextColor dark:text-darkTextPrimary">
                            <div className="flex flex-col">
                                <span className="font-medium">Time Tracking</span>
                                <span className="text-xs text-subTextColor dark:text-darkTextSecondary">Enable desktop app activity recording</span>
                            </div>
                            <Switch
                                checked={switches.is_tracking}
                                onCheckedChange={(val) => setSwitches(prev => ({ ...prev, is_tracking: val }))}
                            />
                        </div>

                        {/* Item 3: URL Tracking */}
                        <div className="flex justify-between items-center text-sm text-headingTextColor dark:text-darkTextPrimary">
                            <div className="flex flex-col">
                                <span className="font-medium">URL & App Tracking</span>
                                <span className="text-xs text-subTextColor dark:text-darkTextSecondary">Record specific website and application usage</span>
                            </div>
                            <Switch
                                checked={switches.url_tracking}
                                onCheckedChange={(val) => setSwitches(prev => ({ ...prev, url_tracking: val }))}
                            />
                        </div>

                        {/* Item 4: webcam Tracking */}
                        <div className="flex justify-between items-center text-sm text-headingTextColor dark:text-darkTextPrimary">
                            <div className="flex flex-col">
                                <span className="font-medium">Camera Tracking</span>
                                <span className="text-xs text-subTextColor dark:text-darkTextSecondary">
                                    Take periodic webcam snapshots during work sessions
                                </span>
                            </div>
                            <Switch
                                checked={switches.cam_tracking}
                                onCheckedChange={(val) => setSwitches(prev => ({ ...prev, cam_tracking: val }))}
                            />
                        </div>
                        {/* Item 5: MFA */}
                        {/* <div className="flex justify-between items-center text-sm text-headingTextColor dark:text-darkTextPrimary">
                        <div className="flex flex-col">
                            <span className="font-medium">Multi-Factor Authentication</span>
                            <span className="text-xs text-subTextColor dark:text-darkTextSecondary">Require an extra security step during login</span>
                        </div>
                        <Switch
                            checked={switches.multi_factor_auth}
                            onCheckedChange={(val) => setSwitches(prev => ({ ...prev, multi_factor_auth: val }))}
                        />
                    </div> */}
                    </div>
                </div>

                {/* Member Information Form */}
                <div className="rounded-md border border-borderColor dark:border-darkBorder p-3 md:p-4 mb-4">
                    <span className="text-subTextColor dark:text-darkTextPrimary text-sm font-medium">Member Details</span>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* Name */}
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} className="dark:bg-darkPrimaryBg dark:border-darkBorder" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Email */}
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input {...field} readOnly className="opacity-70 dark:bg-darkPrimaryBg dark:border-darkBorder" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Pay Rate */}
                                <FormField
                                    control={form.control}
                                    name="pay_rate_hourly"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Hourly Pay Rate ($)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                    className="dark:bg-darkPrimaryBg dark:border-darkBorder"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phone"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    value={field.value || ""}
                                                    placeholder="+1 (555) 000-0000"
                                                    className="dark:bg-darkPrimaryBg dark:border-darkBorder"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* MFA Switch Row */}
                            <div className="flex items-center justify-between p-2 border rounded-md dark:border-darkBorder">
                                <span className="text-sm font-medium">Enable Multi-Factor Authentication</span>
                                <Switch
                                    checked={switches.multi_factor_auth}
                                    onCheckedChange={(val) => setSwitches(prev => ({ ...prev, multi_factor_auth: val }))}
                                />
                            </div>

                            <div className="flex items-center gap-3 w-full pt-4 border-t dark:border-darkBorder">
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Saving..." : "Update Member"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            </div>

            <div className=" flex flex-col sm:flex-row items-start gap-3 sm:items-center sm:justify-between mt-10">
                <div className="flex gap-3">
                    <div className="grid grid-cols-3 lg:flex mt-3 w-[250px] lg:w-auto sm:mt-0 bg-bgSecondary dark:bg-darkSecondaryBg rounded-lg box-border ">
                        {["Projects", "Tasks"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabClick(tab as "Projects" | "Tasks")}
                                className={`px-3.5 h-10 text-sm font-medium transition-all cursor-pointer rounded-lg min-w-[70px] text-center
                                ${activeTab === tab
                                        ? "bg-bgPrimary dark:bg-darkPrimaryBg dark:text-darkTextPrimary text-headingTextColor outline-1 outline-borderColor dark:outline-darkBorder"
                                        : " text-headingTextColor dark:text-darkTextPrimary hover:text-gray-800"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                {/* {
                    activeTab === "Members" ?
                        <Button className=" text-sm md:text-base"><PlusIcon size={20} /> Add Member</Button>
                        :
                        <Button className=" text-sm md:text-base"><PlusIcon size={20} /> Add Task</Button>
                } */}
            </div>
            {
                activeTab === "Projects" ?
                    <SingleMemberProjectTable data={data?.projects}></SingleMemberProjectTable>
                    :
                    <SingleMemberTaskTable data={data?.tasks}></SingleMemberTaskTable>
            }
        </div>
    );
};

export default SingleMemberPage;