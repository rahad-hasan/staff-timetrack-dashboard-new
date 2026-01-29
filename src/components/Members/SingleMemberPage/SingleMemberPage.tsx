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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { singleMemberSchema } from "@/zod/schema";
import { editSingleDetailsMember } from "@/actions/members/action";


const SingleMemberPage = ({ data }: { data: any }) => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"Projects" | "Tasks">("Projects");
    const handleTabClick = (tab: "Projects" | "Tasks") => {
        setActiveTab(tab);
    };

    const [switches, setSwitches] = useState({
        is_active: data?.is_active ?? true,
        is_tracking: data?.is_tracking ?? true,
        url_tracking: data?.url_tracking ?? true,
        cam_tracking: data?.cam_tracking ?? false,
        multi_factor_auth: data?.multi_factor_auth ?? false,
    });

    const form = useForm<z.infer<typeof singleMemberSchema>>({
        resolver: zodResolver(singleMemberSchema),
        defaultValues: {
            name: data?.name || "",
            email: data?.email || "",
            phone: data?.phone || "",
            pay_rate_hourly: data?.pay_rate_hourly || 0,
            role: data?.role || "",
        },
    });

    // const onSubmit = async (values: z.infer<typeof singleMemberSchema>) => {
    //     setLoading(true);
    //     const finalData = {
    //         ...values,
    //         ...switches,
    //         id: data.id,
    //     };

    //     console.log("Final Member Data for Update:", finalData);

    //     setTimeout(() => {
    //         toast.success("Check console for updated data object!");
    //         setLoading(false);
    //     }, 1000);
    // };

    async function onSubmit(values: z.infer<typeof singleMemberSchema>) {
        setLoading(true);
        try {
            const res = await editSingleDetailsMember({ data: { ...values, ...switches }, id: data?.id });

            if (res?.success) {
                toast.success(res?.message || "Member edited successfully");
            } else {
                toast.error(res?.message || "Failed to edit member", {
                    style: {
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none'
                    },
                });
            }
        } catch (error: any) {
            // console.error("failed:", error);
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
            <div className="flex flex-col xl:flex-row gap-4 mb-6">
                <div className="flex-1 flex items-center gap-5 bg-white dark:bg-darkSecondaryBg p-4 rounded-2xl shadow-md border-t border-[#0505050c]">
                    <div className="relative">
                        <Avatar className="w-16 h-16 md:w-20 md:h-20 bg-white dark:bg-darkSecondaryBg">
                            <AvatarImage
                                src={data?.image}
                                alt={data?.name}
                                className="object-cover rounded-full"
                            />
                            <AvatarFallback className="text-2xl font-bold dark:bg-primary/10 text-subTextColor dark:text-darkTextPrimary">
                                {data?.name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h1 className=" text-xl md:text-2xl xl:text-3xl font-bold text-headingTextColor dark:text-darkTextPrimary tracking-tight">
                                {data?.name}
                            </h1>
                            <span className="px-2 py-0.5 rounded text-[12px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                                {data?.role}
                            </span>
                        </div>
                        <p className="text-sm text-subTextColor dark:text-darkTextSecondary flex items-center gap-1">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            {data?.email}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 ">
                    <div className="bg-gradient-to-br from-primary to-[#7a06ffe1] p-4 rounded-2xl text-white sm:min-w-[260px] shadow-md flex flex-col justify-center">
                        <span className="text-[12px] font-bold uppercase opacity-80">Member Since</span>
                        <p className="text-lg font-bold mt-1">
                            {data?.created_at ? new Date(data.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-darkSecondaryBg p-4 rounded-2xl shadow-md border-t border-[#0505050c] sm:min-w-[260px] flex flex-col justify-center">
                        <span className="text-[12px] font-bold uppercase text-subTextColor dark:text-darkTextSecondary">Time Zone</span>
                        <div className="flex items-center gap-2 mt-1">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                            <p className="text-sm font-bold text-headingTextColor dark:text-darkTextPrimary truncate">
                                {data?.time_zone || "UTC"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="xl:w-[80%] rounded-lg border border-borderColor p-3 md:p-4 mt-4 bg-white dark:bg-darkSecondaryBg dark:border-darkBorder">

                <div className="rounded-xl border border-borderColor dark:border-darkBorder p-5 mb-6 bg-white dark:bg-darkSecondaryBg ">
                    <div className="flex justify-between items-end pb-4 mb-6 border-b border-borderColor dark:border-darkBorder">
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">Account & Permissions</h3>
                            <p className="text-sm text-subTextColor dark:text-darkTextSecondary">Manage system access and monitoring preferences</p>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-subTextColor opacity-70 dark:text-darkTextSecondary mb-1">Account Status</span>
                            <span className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase ${switches.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {switches.is_active ? "Active" : "Inactive"}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${switches.is_active ? 'border-primary/20 bg-primary/[0.02]' : 'border-borderColor dark:border-darkBorder'}`}>
                            <div className="flex gap-3 items-center">
                                <div className="p-2 rounded-full bg-gray-100 dark:bg-darkPrimaryBg">
                                    <svg className="w-5 h-5 text-subTextColor dark:text-darkTextSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold">Active Account</span>
                                    <span className="text-xs text-subTextColor dark:text-darkTextSecondary ">Login & system access</span>
                                </div>
                            </div>
                            <Switch
                                checked={switches.is_active}
                                onCheckedChange={(val) => setSwitches(prev => ({ ...prev, is_active: val }))}
                            />
                        </div>

                        <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${switches.is_tracking ? 'border-primary/20 bg-primary/[0.02]' : 'border-borderColor dark:border-darkBorder'}`}>
                            <div className="flex gap-3 items-center">
                                <div className="p-2 rounded-full bg-gray-100 dark:bg-darkPrimaryBg">
                                    <svg className="w-5 h-5 text-subTextColor dark:text-darkTextSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold">Time Tracking</span>
                                    <span className="text-xs text-subTextColor dark:text-darkTextSecondary ">Desktop app recording</span>
                                </div>
                            </div>
                            <Switch
                                checked={switches.is_tracking}
                                onCheckedChange={(val) => setSwitches(prev => ({ ...prev, is_tracking: val }))}
                            />
                        </div>

                        <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${switches.url_tracking ? 'border-primary/20 bg-primary/[0.02]' : 'border-borderColor dark:border-darkBorder'}`}>
                            <div className="flex gap-3 items-center">
                                <div className="p-2 rounded-full bg-gray-100 dark:bg-darkPrimaryBg">
                                    <svg className="w-5 h-5 text-subTextColor dark:text-darkTextSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold">URL & Apps</span>
                                    <span className="text-xs text-subTextColor dark:text-darkTextSecondary ">Website usage tracking</span>
                                </div>
                            </div>
                            <Switch
                                checked={switches.url_tracking}
                                onCheckedChange={(val) => setSwitches(prev => ({ ...prev, url_tracking: val }))}
                            />
                        </div>

                        <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${switches.cam_tracking ? 'border-primary/20 bg-primary/[0.02]' : 'border-borderColor dark:border-darkBorder'}`}>
                            <div className="flex gap-3 items-center">
                                <div className="p-2 rounded-full bg-gray-100 dark:bg-darkPrimaryBg">
                                    <svg className="w-5 h-5 text-subTextColor dark:text-darkTextSecondary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold">Webcam Screenshots</span>
                                    <span className="text-xs text-subTextColor dark:text-darkTextSecondary ">Periodic work snapshots</span>
                                </div>
                            </div>
                            <Switch
                                checked={switches.cam_tracking}
                                onCheckedChange={(val) => setSwitches(prev => ({ ...prev, cam_tracking: val }))}
                            />
                        </div>

                    </div>
                </div>

                <div className="rounded-md border border-borderColor dark:border-darkBorder p-3 md:p-4 mb-4">
                    <span className="text-subTextColor dark:text-darkTextPrimary text-sm font-medium">Member Details</span>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                            <div className="grid sm:grid-cols-2 gap-4 sm:gap-3 items-start">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Full Name</FormLabel>
                                            <FormControl>
                                                <Input {...field} className="dark:bg-darkPrimaryBg dark:border-darkBorder" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input {...field} readOnly className="opacity-70 dark:bg-darkPrimaryBg dark:border-darkBorder" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4 sm:gap-3 items-center">
                                <FormField
                                    control={form.control}
                                    name="pay_rate_hourly"
                                    render={({ field }) => (
                                        <FormItem className="w-full">
                                            <FormLabel className="text-sm">Hourly Pay Rate ($)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                    className="dark:bg-darkPrimaryBg dark:border-darkBorder py-2 px-3"
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
                                        <FormItem className="w-full">
                                            <FormLabel className="text-sm">Phone Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    value={field.value || ""}
                                                    placeholder="Phone Number"
                                                    className="dark:bg-darkPrimaryBg dark:border-darkBorder "
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem className=" w-full">
                                        <FormLabel>User Role</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl className=" w-full">
                                                <SelectTrigger className="dark:bg-darkPrimaryBg dark:border-darkBorder">
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="manager">Manager</SelectItem>
                                                <SelectItem value="hr">HR</SelectItem>
                                                <SelectItem value="project_manager">Project Manager</SelectItem>
                                                <SelectItem value="employee">Employee</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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

            <div className=" flex flex-col sm:flex-row items-start gap-3 sm:items-center sm:justify-between mt-5">
                <div className="flex gap-3">
                    <div className="grid grid-cols-2 gap-1 lg:flex mt-3 sm:mt-0 bg-bgSecondary dark:bg-darkSecondaryBg rounded-lg box-border ">
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