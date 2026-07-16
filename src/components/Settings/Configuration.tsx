/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Switch } from "@/components/ui/switch"
import { leaveSettingsSchema } from "@/zod/schema";
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
import {
    Bell,
    Building2,
    Check,
    ChevronsUpDown,
    Clock,
    Globe,
    Info,
    Link2,
    Mail,
    MapPin,
    Phone,
    Sliders,
    Wallet,
} from "lucide-react";
import { popularTimeZoneList } from "@/utils/TimeZoneList";
import { currencies } from "@/utils/CurrencyList";
import { useLogInUserStore } from "@/store/logInUserStore";
import { weekendPreview } from "@/lib/payroll";

const daysOfWeek = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

const SectionHeader = ({
    icon: Icon,
    title,
    description,
    accent = "green",
}: {
    icon: React.ElementType;
    title: string;
    description: string;
    accent?: "green" | "blue" | "amber" | "violet";
}) => {
    const accentMap: Record<string, string> = {
        green: "bg-primary/10 text-primary",
        blue: "bg-blue-500/10 text-blue-500",
        amber: "bg-amber-500/10 text-amber-500",
        violet: "bg-violet-500/10 text-violet-500",
    };
    return (
        <div className="flex items-start gap-3">
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", accentMap[accent])}>
                <Icon className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
                <h3 className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">{title}</h3>
                <p className="mt-0.5 text-xs text-subTextColor dark:text-darkTextSecondary">{description}</p>
            </div>
        </div>
    );
};

const Configuration = ({ data }: { data: ICompany }) => {
    const [loading, setLoading] = useState(false);
    const { updateUserData } = useLogInUserStore();

    const [switches, setSwitches] = useState({
        app_notify: data?.app_notify || false,
        email_notify: data?.email_notify || false,
        url_tracking_enabled: data?.url_tracking_enabled || false,
    });

    const form = useForm<z.input<typeof leaveSettingsSchema>>({
        resolver: zodResolver(leaveSettingsSchema),
        defaultValues: {
            name: data?.name || "",
            email: data?.email || "",
            phone: data?.phone || "",
            address: data?.address || "",
            time_zone: data?.time_zone || "",
            currency: data?.currency || "USD",
            idle_minutes_limit: data?.idle_minutes_limit || 10,
            week_start: data?.week_start || "Monday",
            weekly_leave_count: data?.weekly_leave_count ?? 2,
        },
    });

    const watchWeekStart = form.watch("week_start");
    const watchWeeklyLeaveCount = form.watch("weekly_leave_count");
    const weekendLabel = weekendPreview(
        watchWeekStart || "Monday",
        Number.isFinite(watchWeeklyLeaveCount) ? watchWeeklyLeaveCount : 2,
    );

    async function onSubmit(values: z.infer<typeof leaveSettingsSchema>) {
        const finalData = {
            ...values,
            ...switches,
        };
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
        <div className="xl:w-[80%] mt-4">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    {/* Company Information */}
                    <section className="rounded-xl border border-borderColor bg-white p-4 md:p-6 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
                        <SectionHeader
                            icon={Building2}
                            title="Company Information"
                            description="Basic details used across invoices, reports and payroll."
                            accent="green"
                        />

                        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required={true}>Company Name</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Building2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subTextColor dark:text-darkTextSecondary" />
                                                <Input
                                                    placeholder="Enter company name"
                                                    className="pl-9 dark:bg-darkPrimaryBg dark:border-darkBorder"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required={true}>Company Email</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subTextColor dark:text-darkTextSecondary" />
                                                <Input
                                                    type="email"
                                                    placeholder="Enter company email"
                                                    className="pl-9 dark:bg-darkPrimaryBg dark:border-darkBorder"
                                                    {...field}
                                                />
                                            </div>
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
                                        <FormLabel required={true}>Phone Number</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subTextColor dark:text-darkTextSecondary" />
                                                <Input
                                                    type="text"
                                                    placeholder="e.g. +8801XXXXXXXXX"
                                                    className="pl-9 dark:bg-darkPrimaryBg dark:border-darkBorder"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const sanitizedValue = e.target.value.replace(/[^\d+]/g, "");
                                                        field.onChange(sanitizedValue);
                                                    }}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required={true}>Address</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subTextColor dark:text-darkTextSecondary" />
                                                <Input
                                                    placeholder="Enter address"
                                                    className="pl-9 dark:bg-darkPrimaryBg dark:border-darkBorder"
                                                    {...field}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </section>

                    {/* Notifications */}
                    <section className="rounded-xl border border-borderColor bg-white p-4 md:p-6 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
                        <SectionHeader
                            icon={Bell}
                            title="Notifications"
                            description="Choose where and how you'd like to be notified."
                            accent="blue"
                        />

                        <div className="mt-5 rounded-lg border border-borderColor dark:border-darkBorder">
                            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">Notification Preferences</p>
                                    <p className="mt-0.5 text-xs text-subTextColor dark:text-darkTextSecondary">
                                        Turn channels on to receive activity updates and system alerts.
                                    </p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2 text-xs font-medium text-subTextColor dark:text-darkTextSecondary">
                                        <span>In-App</span>
                                        <Switch
                                            checked={switches.app_notify}
                                            onCheckedChange={(val) => setSwitches(prev => ({ ...prev, app_notify: val }))}
                                        />
                                    </label>
                                    <label className="flex items-center gap-2 text-xs font-medium text-subTextColor dark:text-darkTextSecondary">
                                        <span>Email</span>
                                        <Switch
                                            checked={switches.email_notify}
                                            onCheckedChange={(val) => setSwitches(prev => ({ ...prev, email_notify: val }))}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* URL Tracking */}
                    <section className="rounded-xl border border-borderColor bg-white p-4 md:p-6 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
                        <SectionHeader
                            icon={Link2}
                            title="URL Tracking"
                            description="Capture visited URLs while the tracker is running."
                            accent="violet"
                        />

                        <div className="mt-5 flex items-center justify-between rounded-lg border border-borderColor p-4 dark:border-darkBorder">
                            <div>
                                <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">URL Tracking</p>
                                <p className="mt-0.5 text-xs text-subTextColor dark:text-darkTextSecondary">
                                    When enabled, browser URLs will appear in member activity.
                                </p>
                            </div>
                            <Switch
                                checked={switches.url_tracking_enabled}
                                onCheckedChange={(val) => setSwitches(prev => ({ ...prev, url_tracking_enabled: val }))}
                            />
                        </div>
                    </section>

                    {/* Workspace & Payroll */}
                    <section className="rounded-xl border border-borderColor bg-white p-4 md:p-6 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg">
                        <SectionHeader
                            icon={Sliders}
                            title="Workspace & Payroll"
                            description="Regional preferences that drive tracking behavior and payroll runs."
                            accent="amber"
                        />

                        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                                        className="flex justify-between font-normal dark:text-darkTextPrimary hover:dark:bg-darkPrimaryBg"
                                                    >
                                                        <span className="flex items-center gap-2 truncate">
                                                            <Globe className="h-4 w-4 text-subTextColor dark:text-darkTextSecondary" />
                                                            {field.value
                                                                ? popularTimeZoneList.find((tz) => tz.value === field.value)?.label
                                                                : "Select time zone"}
                                                        </span>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 dark:bg-darkSecondaryBg dark:border-darkBorder">
                                                <Command className="dark:bg-darkSecondaryBg">
                                                    <CommandInput placeholder="Search time zone..." />
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

                            <FormField
                                control={form.control}
                                name="currency"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel required={true}>Currency</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline2"
                                                        role="combobox"
                                                        className="flex justify-between font-normal dark:text-darkTextPrimary hover:dark:bg-darkPrimaryBg"
                                                    >
                                                        <span className="flex items-center gap-2 truncate">
                                                            <Wallet className="h-4 w-4 text-subTextColor dark:text-darkTextSecondary" />
                                                            {field.value
                                                                ? currencies.find((c) => c.value === field.value)?.label ?? field.value
                                                                : "Select currency"}
                                                        </span>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0 dark:bg-darkSecondaryBg dark:border-darkBorder">
                                                <Command className="dark:bg-darkSecondaryBg">
                                                    <CommandInput placeholder="Search currency..." />
                                                    <CommandList className="overflow-y-auto no-scrollbar scroll-smooth">
                                                        <CommandEmpty>No currency found.</CommandEmpty>
                                                        <CommandGroup>
                                                            {currencies.map((c) => (
                                                                <CommandItem
                                                                    key={c.value}
                                                                    value={c.label}
                                                                    onSelect={() => {
                                                                        form.setValue("currency", c.value, { shouldValidate: true, shouldDirty: true });
                                                                        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
                                                                    }}
                                                                    className="cursor-pointer hover:dark:bg-darkPrimaryBg"
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            c.value === field.value ? "opacity-100" : "opacity-0",
                                                                        )}
                                                                    />
                                                                    {c.label}
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

                            <FormField
                                control={form.control}
                                name="idle_minutes_limit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required={true}>Idle Minutes Limit</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Clock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-subTextColor dark:text-darkTextSecondary" />
                                                <Input
                                                    type="number"
                                                    className="pl-9 pr-16 dark:bg-darkPrimaryBg dark:border-darkBorder"
                                                    {...field}
                                                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                                                />
                                                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-subTextColor dark:text-darkTextSecondary">
                                                    minutes
                                                </span>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="week_start"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required={true}>Week Start Day</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="dark:bg-darkPrimaryBg dark:border-darkBorder">
                                                    <SelectValue placeholder="Select start day" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="dark:border-darkBorder">
                                                {daysOfWeek.map((day) => (
                                                    <SelectItem key={day} value={day}>{day}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="weekly_leave_count"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel required={true}>Weekend Length</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(Number(value))}
                                            value={String(field.value ?? 2)}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="dark:bg-darkPrimaryBg dark:border-darkBorder">
                                                    <SelectValue placeholder="Select weekend length" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="dark:border-darkBorder">
                                                {[0, 1, 2, 3, 4, 5, 6, 7].map((count) => (
                                                    <SelectItem key={count} value={String(count)}>
                                                        {count} day{count === 1 ? "" : "s"}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormItem>
                                <FormLabel>Weekend Preview</FormLabel>
                                <div className="flex h-10 items-center rounded-md border border-dashed border-borderColor bg-bgSecondary/70 px-3 text-sm text-headingTextColor dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary">
                                    Weekly weekends are&nbsp;<span className="font-semibold text-primary">{weekendLabel}</span>
                                </div>
                            </FormItem>
                        </div>

                        <div className="mt-5 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-900/20 dark:text-amber-200">
                            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>
                                Changing weekend settings affects <span className="font-semibold">future</span> payroll runs only. Already-generated runs keep their original target hours.
                            </span>
                        </div>
                    </section>

                    {/* Footer / Action bar */}
                    <div className="sticky bottom-0 z-10 -mx-1 flex items-center justify-end gap-3 rounded-xl border border-borderColor bg-white/90 px-4 py-3 shadow-sm backdrop-blur dark:border-darkBorder dark:bg-darkSecondaryBg/90">
                        <p className="mr-auto text-xs text-subTextColor dark:text-darkTextSecondary">
                            Changes apply immediately after saving.
                        </p>
                        <Button
                            type="button"
                            variant="outline2"
                            onClick={() => form.reset()}
                            disabled={loading}
                            className="dark:border-darkBorder dark:text-darkTextPrimary hover:dark:bg-darkPrimaryBg"
                        >
                            Reset
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default Configuration;
