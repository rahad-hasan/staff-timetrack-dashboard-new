/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
    ArrowLeft,
    BadgeCheck,
    BriefcaseBusiness,
    CalendarDays,
    Camera,
    Check,
    ChevronsUpDown,
    Clock3,
    FolderKanban,
    Globe2,
    Link2,
    LockKeyhole,
    Mail,
    MapPin,
    Phone,
    Save,
    Shield,
    ShieldCheck,
    Sparkles,
    TimerReset,
    UserRound,
} from "lucide-react";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { singleMemberSchema } from "@/zod/schema";
import { editSingleDetailsMember } from "@/actions/members/action";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { popularTimeZoneList } from "@/utils/TimeZoneList";
import { CustomCalendarForDOB } from "@/components/ui/customCalendarForDOB";
import { useLogInUserStore } from "@/store/logInUserStore";
import { EmploymentStatus } from "@/types/type";
import { currencies } from "@/utils/CurrencyList";

const SingleMemberPage = ({
    data,
}: {
    data: any;
}) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const logInUserData = useLogInUserStore((state) => state.logInUserData);

    const [switches, setSwitches] = useState({
        is_active: data?.is_active,
        is_tracking: data?.is_tracking,
        url_tracking: data?.url_tracking,
        cam_tracking: data?.cam_tracking,
        multi_factor_auth: data?.multi_factor_auth,
    });

    const genderOptions = ["male", "female", "other"] as const;
    const employmentStatusOptions: Array<{
        value: EmploymentStatus;
        label: string;
    }> = [
            { value: "probation", label: "Probation" },
            { value: "permanent", label: "Permanent" },
        ];

    const formatDateOnly = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const parseBirthDay = (raw: string | Date | null | undefined): string => {
        if (!raw) return "";
        if (typeof raw === "string") {
            const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
            if (match) return match[1];
        }
        const d = raw instanceof Date ? raw : new Date(raw);
        if (isNaN(d.getTime())) return "";
        return formatDateOnly(d);
    };

    const formatDateLabel = (raw?: string | null) => {
        if (!raw) return "N/A";
        const d = new Date(raw);
        if (isNaN(d.getTime())) return "N/A";
        return d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const initialBirthDay = parseBirthDay(data?.birth_day);
    const [dobOpen, setDobOpen] = useState(false);
    const [dobDate, setDobDate] = useState<Date | undefined>(
        initialBirthDay ? new Date(`${initialBirthDay}T00:00:00`) : undefined,
    );

    const form = useForm<z.infer<typeof singleMemberSchema>>({
        resolver: zodResolver(singleMemberSchema),
        defaultValues: {
            name: data?.name || "",
            email: data?.email || "",
            phone: data?.phone || "",
            pay_rate_hourly: data?.pay_rate_hourly || 0,
            role: data?.role || "",
            status: (data?.status as EmploymentStatus | undefined) ?? undefined,
            time_zone: data?.time_zone || "",
            gender: (data?.gender as "male" | "female" | "other") || "male",
            currency: data?.currency || "USD",
            birth_day: initialBirthDay,
        },
    });

    const totalProjects = data?.total_projects ?? data?.projects?.length ?? 0;
    const pendingTasks = data?.pending_tasks ?? 0;
    const assignedSchedule = useMemo(
        () =>
            data?.scheduleAssigns?.find((item: any) => item?.schedule)?.schedule ?? null,
        [data?.scheduleAssigns],
    );

    const formatScheduleTime = (raw?: string | null) => {
        if (!raw) return "N/A";
        const match = raw.match(/T(\d{2}):(\d{2})/);
        if (!match) return "N/A";

        const hour = Number(match[1]);
        const minute = Number(match[2]);
        const period = hour >= 12 ? "PM" : "AM";
        const formattedHour = hour % 12 === 0 ? 12 : hour % 12;

        return `${formattedHour}:${String(minute).padStart(2, "0")} ${period}`;
    };

    const controlItems = [
        {
            key: "is_active" as const,
            label: "Active Account",
            hint: "Login and system access",
            icon: BadgeCheck,
        },
        {
            key: "is_tracking" as const,
            label: "Time Tracking",
            hint: "Desktop tracking permissions",
            icon: TimerReset,
        },
        {
            key: "url_tracking" as const,
            label: "URL and Apps",
            hint: "Website and app usage tracking",
            icon: Link2,
        },
        {
            key: "cam_tracking" as const,
            label: "Webcam Screenshots",
            hint: "Periodic work snapshots",
            icon: Camera,
        },
        {
            key: "multi_factor_auth" as const,
            label: "Multi-Factor Auth",
            hint: "Additional account verification",
            icon: LockKeyhole,
        },
    ];

    async function onSubmit(values: z.infer<typeof singleMemberSchema>) {
        setLoading(true);

        try {
            // const dirtyFields = form.formState.dirtyFields;

            // const payload: Record<string, any> = {};

            // // Form fields
            // Object.keys(dirtyFields).forEach((key) => {
            //     payload[key] = values[key as keyof typeof values];
            // });

            const payload: Record<string, any> = {};

            // Compare form values manually
            Object.entries(values).forEach(([key, value]) => {
                const originalValue = data?.[key];

                // normalize null/undefined
                const normalizedOriginal =
                    originalValue === null || originalValue === undefined
                        ? ""
                        : originalValue;

                const normalizedNew =
                    value === null || value === undefined
                        ? ""
                        : value;

                // compare values
                if (normalizedOriginal !== normalizedNew) {
                    payload[key] = value;
                }
            });

            // Switch fields
            if (switches.is_active !== data?.is_active) {
                payload.is_active = Boolean(switches.is_active);
            }

            if (switches.is_tracking !== data?.is_tracking) {
                payload.is_tracking = Boolean(switches.is_tracking);
            }

            if (switches.url_tracking !== data?.url_tracking) {
                payload.url_tracking = Boolean(switches.url_tracking);
            }

            if (switches.cam_tracking !== data?.cam_tracking) {
                payload.cam_tracking = Boolean(switches.cam_tracking);
            }

            if (switches.multi_factor_auth !== data?.multi_factor_auth) {
                payload.multi_factor_auth = Boolean(
                    switches.multi_factor_auth
                );
            }

            // If nothing changed
            if (Object.keys(payload).length === 0) {
                toast.info("No changes detected");
                return;
            }

            console.log("Sending payload:", payload);

            const res = await editSingleDetailsMember({
                data: payload,
                id: data?.id,
            });

            if (res?.success) {
                toast.success(res?.message || "Member edited successfully");
            } else {
                toast.error(res?.message || "Failed to edit member", {
                    style: {
                        backgroundColor: "#ef4444",
                        color: "white",
                        border: "none",
                    },
                });
            }
        } catch (error: any) {
            toast.error(error?.message || "Something went wrong!", {
                style: {
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                },
            });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            <section className="overflow-hidden rounded-[12px] border border-emerald-100 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(135deg,#f8fffc_0%,#eefbf5_42%,#e5f7ef_100%)] p-4 text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.08)] dark:border-darkBorder dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_28%),linear-gradient(180deg,#0c1524_0%,#111b2d_100%)] dark:text-white dark:shadow-[0_30px_80px_rgba(2,6,23,0.35)] sm:p-6">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-start gap-3">
                            <Button
                                type="button"
                                variant="outline2"
                                size="icon"
                                className="border-emerald-200 bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                                onClick={() => router.back()}
                            >
                                <ArrowLeft className="size-4" />
                            </Button>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-white/65">Employees</p>
                                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
                                    Update Employee
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base dark:text-white/70">
                                    Update employee information, permissions, payroll context,
                                    and workspace preferences.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button
                                type="button"
                                variant="outline2"
                                className="border-emerald-200 bg-white/80 text-slate-700 hover:bg-white hover:text-slate-900 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:text-white"
                                onClick={() => router.back()}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="member-details-form"
                                disabled={loading}
                                className=""
                            >
                                <Save className="size-4" />
                                {loading ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>

                    <div className="rounded-[12px] border border-white/60 bg-white/72 p-4 backdrop-blur-md dark:border-white/10 dark:bg-white/5 sm:p-6">
                        <div className="grid gap-6 xl:grid-cols-[1.2fr_2fr] xl:items-center">
                            <div className="flex items-start gap-4 sm:gap-5">
                                <Avatar className="size-20 border border-primary/60 dark:border-primary/60 bg-white shadow-[0_0_0_8px_rgba(16,185,129,0.08)] sm:size-28 dark:bg-white/10">
                                    <AvatarImage
                                        src={data?.image}
                                        alt={data?.name}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-transparent text-3xl font-semibold text-slate-900 dark:text-white">
                                        {data?.name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                                            {data?.name || "Unknown Employee"}
                                        </h2>
                                        <span className="rounded-full border border-primary bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-400/30 dark:bg-emerald-500/15 dark:text-primary">
                                            {data?.role || "Employee"}
                                        </span>
                                    </div>

                                    <div className="mt-3 space-y-2 text-sm text-slate-600 dark:text-white/72">
                                        <div className="flex items-center gap-2">
                                            <Mail className="size-4 text-primary" />
                                            <span className="truncate">{data?.email || "No email"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Globe2 className="size-4 text-primary" />
                                            <span>{data?.time_zone || "UTC"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
                                <div className="rounded-[12px] border border-white/70 bg-white/70 px-4 py-4 dark:border-white/10 dark:bg-black/10">
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-white/65">
                                        <CalendarDays className="size-4 text-primary dark:text-primary" />
                                        <span className="text-xs uppercase tracking-[0.16em]">
                                            Member Since
                                        </span>
                                    </div>
                                    <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
                                        {formatDateLabel(data?.created_at)}
                                    </p>
                                </div>

                                <div className="rounded-[12px] border border-white/70 bg-white/70 px-4 py-4 dark:border-white/10 dark:bg-black/10">
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-white/65">
                                        <FolderKanban className="size-4 text-primary dark:text-primary" />
                                        <span className="text-xs uppercase tracking-[0.16em]">
                                            Total Projects
                                        </span>
                                    </div>
                                    <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{totalProjects}</p>
                                </div>

                                <div className="rounded-[12px] border border-white/70 bg-white/70 px-4 py-4 dark:border-white/10 dark:bg-black/10">
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-white/65">
                                        <Clock3 className="size-4 text-primary dark:text-primary" />
                                        <span className="text-xs uppercase tracking-[0.16em]">
                                            Pending Tasks
                                        </span>
                                    </div>
                                    <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">{pendingTasks}</p>
                                </div>

                                <div className="rounded-[12px] border border-white/70 bg-white/70 px-4 py-4 dark:border-white/10 dark:bg-black/10">
                                    <div className="flex items-center gap-2 text-slate-500 dark:text-white/65">
                                        <ShieldCheck className="size-4 text-primary dark:text-primary" />
                                        <span className="text-xs uppercase tracking-[0.16em]">
                                            Employment Status
                                        </span>
                                    </div>
                                    <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-white">
                                        {data?.status === "probation"
                                            ? "Probation"
                                            : data?.status === "permanent"
                                                ? "Permanent"
                                                : "Not Set"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="rounded-[12px] border border-borderColor bg-white/95 p-5 backdrop-blur dark:border-darkBorder dark:bg-darkSecondaryBg/95 sm:p-6">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
                            Account Controls
                        </h3>
                        <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                            Manage access, tracking, and security settings from the top layer of
                            the employee profile.
                        </p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:bg-emerald-500/10 dark:text-primary">
                        <Sparkles className="size-3.5" />
                        HR Workspace Controls
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                    {controlItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div
                                key={item.key}
                                className="rounded-[12px] border border-borderColor bg-[#f7fafc] px-4 py-3 dark:border-darkBorder dark:bg-darkPrimaryBg"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="rounded-xl bg-primary/10 p-2 text-primary">
                                        <Icon className="size-3.5" />
                                    </div>
                                    <Switch
                                        checked={Boolean(switches[item.key])}
                                        onCheckedChange={(val) =>
                                            setSwitches((prev) => ({ ...prev, [item.key]: val }))
                                        }
                                    />
                                </div>
                                <p className="mt-3 text-sm font-semibold leading-none text-headingTextColor dark:text-darkTextPrimary">
                                    {item.label}
                                </p>
                                <p className="mt-1 text-xs leading-4 text-subTextColor dark:text-darkTextSecondary">
                                    {item.hint}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_380px]">
                <div className="space-y-6">
                    <div className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkSecondaryBg sm:p-6">
                        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-xl font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                    Employee Information
                                </h3>
                                <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                                    Keep this profile accurate for payroll, permissions, and leave
                                    eligibility.
                                </p>
                            </div>
                            <span className="rounded-full bg-bgSecondary px-3 py-1 text-xs font-medium text-subTextColor dark:bg-darkPrimaryBg dark:text-darkTextSecondary">
                                Last updated {formatDateLabel(data?.updated_at)}
                            </span>
                        </div>

                        <Form {...form}>
                            <form
                                id="member-details-form"
                                onSubmit={form.handleSubmit(onSubmit)}
                                className="space-y-5"
                            >
                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem className="w-full min-w-0">
                                                <FormLabel required>Full Name</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subTextColor dark:text-darkTextSecondary" />
                                                        <Input
                                                            {...field}
                                                            className="!h-[52px] min-h-[52px] pl-9 dark:border-darkBorder dark:bg-darkPrimaryBg"
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
                                            <FormItem className="w-full min-w-0">
                                                <FormLabel required>Email Address</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subTextColor dark:text-darkTextSecondary" />
                                                        <Input
                                                            {...field}
                                                            className="!h-[52px] min-h-[52px] pl-9 dark:border-darkBorder dark:bg-darkPrimaryBg"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subTextColor dark:text-darkTextSecondary" />
                                                        <Input
                                                            {...field}
                                                            value={field.value || ""}
                                                            placeholder="Phone Number"
                                                            className="!h-[52px] min-h-[52px] pl-9 dark:border-darkBorder dark:bg-darkPrimaryBg"
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="birth_day"
                                        render={({ field }) => (
                                            <FormItem className="flex w-full min-w-0 flex-col">
                                                <FormLabel>Date of Birth</FormLabel>
                                                <Popover open={dobOpen} onOpenChange={setDobOpen}>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <button
                                                                type="button"
                                                                className={cn(
                                                                    "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 py-2 text-left text-sm dark:border-darkBorder dark:bg-darkPrimaryBg",
                                                                    "!h-[52px] min-h-[52px] py-0",
                                                                    !field.value &&
                                                                    "text-muted-foreground dark:text-darkTextSecondary",
                                                                )}
                                                            >
                                                                <span>{field.value || "Select date"}</span>
                                                                <CalendarDays className="size-4 text-subTextColor dark:text-darkTextSecondary" />
                                                            </button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                                                        <CustomCalendarForDOB
                                                            mode="single"
                                                            selected={dobDate}
                                                            defaultMonth={dobDate}
                                                            captionLayout="dropdown"
                                                            onSelect={(selectedDate) => {
                                                                if (!selectedDate) return;
                                                                setDobDate(selectedDate);
                                                                setDobOpen(false);
                                                                field.onChange(formatDateOnly(selectedDate));
                                                            }}
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="role"
                                        render={({ field }) => (
                                            <FormItem className="w-full min-w-0">
                                                <FormLabel required>User Role</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="!h-[52px] min-h-[52px] w-full py-0 dark:border-darkBorder dark:bg-darkPrimaryBg">
                                                            <SelectValue placeholder="Select a role" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {logInUserData?.role === "admin" ? (
                                                            <SelectItem className="min-h-[52px]" value="admin">Admin</SelectItem>
                                                        ) : null}
                                                        <SelectItem className="min-h-[52px]" value="manager">Manager</SelectItem>
                                                        <SelectItem className="min-h-[52px]" value="hr">HR</SelectItem>
                                                        <SelectItem className="min-h-[52px]" value="project_manager">
                                                            Project Manager
                                                        </SelectItem>
                                                        <SelectItem className="min-h-[52px]" value="employee">Employee</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem className="w-full min-w-0">
                                                <FormLabel>Employment Status</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="!h-[52px] min-h-[52px] w-full py-0 dark:border-darkBorder dark:bg-darkPrimaryBg">
                                                            <SelectValue placeholder="Select employment status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {employmentStatusOptions.map((status) => (
                                                            <SelectItem className="min-h-[52px]" key={status.value} value={status.value}>
                                                                {status.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="grid gap-4 md:grid-cols-3">
                                    <FormField
                                        control={form.control}
                                        name="gender"
                                        render={({ field }) => (
                                            <FormItem className="w-full min-w-0">
                                                <FormLabel required>Gender</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="!h-[52px] min-h-[52px] w-full py-0 capitalize dark:border-darkBorder dark:bg-darkPrimaryBg">
                                                            <SelectValue placeholder="Select gender" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {genderOptions.map((g) => (
                                                            <SelectItem key={g} value={g} className="min-h-[52px] capitalize">
                                                                {g}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="time_zone"
                                        render={({ field }) => (
                                            <FormItem className="flex w-full min-w-0 flex-col">
                                                <FormLabel required>Time Zone</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline2"
                                                                role="combobox"
                                                                className="!h-[52px] min-h-[52px] w-full justify-between py-0 dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary hover:dark:bg-darkPrimaryBg"
                                                            >
                                                                <span className="truncate">
                                                                    {field.value
                                                                        ? popularTimeZoneList.find(
                                                                            (tz) => tz.value === field.value,
                                                                        )?.label
                                                                        : "Select time zone"}
                                                                </span>
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 dark:border-darkBorder dark:bg-darkSecondaryBg">
                                                        <Command className="dark:bg-darkSecondaryBg">
                                                            <CommandInput placeholder="Search time zone..." />
                                                            <CommandList className="no-scrollbar overflow-y-scroll scroll-smooth">
                                                                <CommandEmpty>No time zone found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {popularTimeZoneList.map((tz) => (
                                                                        <CommandItem
                                                                            key={tz.value}
                                                                            value={tz.label}
                                                                            onSelect={() => {
                                                                                form.setValue("time_zone", tz.value);
                                                                                document.dispatchEvent(
                                                                                    new KeyboardEvent("keydown", {
                                                                                        key: "Escape",
                                                                                    }),
                                                                                );
                                                                            }}
                                                                            className="min-h-[52px] cursor-pointer hover:dark:bg-darkPrimaryBg"
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    tz.value === field.value
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0",
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
                                                <FormLabel required>Currency</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline2"
                                                                role="combobox"
                                                                className="!h-[52px] min-h-[52px] w-full justify-between py-0 dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary hover:dark:bg-darkPrimaryBg"
                                                            >
                                                                <span className="truncate">
                                                                    {field.value
                                                                        ? currencies.find(
                                                                            (currency) =>
                                                                                currency.value === field.value
                                                                        )?.label
                                                                        : "Select currency"}
                                                                </span>
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        className="w-[--radix-popover-trigger-width] p-0 dark:border-darkBorder dark:bg-darkSecondaryBg"
                                                    >
                                                        <Command className="dark:bg-darkSecondaryBg">
                                                            <CommandInput placeholder="Search currency..." />
                                                            <CommandList className="max-h-[300px] overflow-y-auto">
                                                                <CommandEmpty>
                                                                    No currency found.
                                                                </CommandEmpty>
                                                                <CommandGroup>
                                                                    {currencies.map((currency) => (
                                                                        <CommandItem
                                                                            key={currency.value}
                                                                            value={`${currency.label} ${currency.value}`}
                                                                            onSelect={() => {
                                                                                form.setValue(
                                                                                    "currency",
                                                                                    currency.value
                                                                                );

                                                                                document.dispatchEvent(
                                                                                    new KeyboardEvent("keydown", {
                                                                                        key: "Escape",
                                                                                    })
                                                                                );
                                                                            }}
                                                                            className="min-h-[48px] cursor-pointer hover:dark:bg-darkPrimaryBg"
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    currency.value === field.value
                                                                                        ? "opacity-100"
                                                                                        : "opacity-0"
                                                                                )}
                                                                            />
                                                                            {currency.label}
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

                                <div className="grid gap-4 md:grid-cols-2">
                                    <FormField
                                        control={form.control}
                                        name="pay_rate_hourly"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel required>Hourly Pay Rate ($)</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        {...field}
                                                        onChange={(e) =>
                                                            field.onChange(e.target.valueAsNumber)
                                                        }
                                                        className="!h-[52px] min-h-[52px] dark:border-darkBorder dark:bg-darkPrimaryBg"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="rounded-[12px] border border-borderColor bg-bgSecondary/50 p-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                                                <MapPin className="size-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                                                    Workspace Snapshot
                                                </p>
                                                <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
                                                    {data?.time_zone || "UTC"} timezone,{" "}
                                                    {data?.currency || "USD"} payroll currency, and{" "}
                                                    {switches.is_active ? "active" : "inactive"} account
                                                    access.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 border-t border-borderColor pt-4 dark:border-darkBorder">
                                    <Button type="submit" disabled={loading}>
                                        <Save className="size-4" />
                                        {loading ? "Saving..." : "Save Profile"}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline2"
                                        className="dark:border-darkBorder dark:bg-darkPrimaryBg dark:text-darkTextPrimary"
                                        onClick={() => router.back()}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>

                <aside className="space-y-6">
                    <div className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                    Work Schedule
                                </h3>
                                <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
                                    Assigned shift details and attendance rules.
                                </p>
                            </div>
                            <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                                <CalendarDays className="size-4" />
                            </div>
                        </div>

                        {assignedSchedule ? (
                            <div className="mt-5 space-y-4">
                                <div className="rounded-[12px] border border-borderColor bg-bgSecondary/70 p-4 dark:border-darkBorder dark:bg-darkPrimaryBg">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-subTextColor dark:text-darkTextSecondary">
                                        Schedule Name
                                    </p>
                                    <p className="mt-2 text-base font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                        {assignedSchedule.name}
                                    </p>
                                    <div className="mt-4 grid grid-cols-2 gap-3">
                                        <div className="rounded-[12px] bg-white px-3 py-3 dark:bg-darkSecondaryBg">
                                            <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                                                Start Time
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                                {formatScheduleTime(assignedSchedule.start_time)}
                                            </p>
                                        </div>
                                        <div className="rounded-[12px] bg-white px-3 py-3 dark:bg-darkSecondaryBg">
                                            <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                                                End Time
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                                {formatScheduleTime(assignedSchedule.end_time)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-5 rounded-[12px] border border-dashed border-borderColor bg-bgSecondary/60 p-5 dark:border-darkBorder dark:bg-darkPrimaryBg">
                                <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                                    No schedule assigned
                                </p>
                                <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
                                    This employee does not currently have a shift schedule linked to
                                    the profile.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                                Quick Insights
                            </h3>
                        </div>

                        <div className="mt-5 space-y-3 text-sm">
                            <div className="flex items-center justify-between rounded-[12px] bg-bgSecondary px-4 py-3 dark:bg-darkPrimaryBg">
                                <span className="flex items-center gap-2 text-subTextColor dark:text-darkTextSecondary">
                                    <Clock3 className="size-4" />
                                    Last Updated
                                </span>
                                <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                                    {formatDateLabel(data?.updated_at)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-[12px] bg-bgSecondary px-4 py-3 dark:bg-darkPrimaryBg">
                                <span className="flex items-center gap-2 text-subTextColor dark:text-darkTextSecondary">
                                    <BriefcaseBusiness className="size-4" />
                                    Total Projects
                                </span>
                                <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                                    {totalProjects}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-[12px] bg-bgSecondary px-4 py-3 dark:bg-darkPrimaryBg">
                                <span className="flex items-center gap-2 text-subTextColor dark:text-darkTextSecondary">
                                    <Check className="size-4" />
                                    Pending Tasks
                                </span>
                                <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                                    {pendingTasks}
                                </span>
                            </div>
                            <div className="flex items-center justify-between rounded-[12px] bg-bgSecondary px-4 py-3 dark:bg-darkPrimaryBg">
                                <span className="flex items-center gap-2 text-subTextColor dark:text-darkTextSecondary">
                                    <Shield className="size-4" />
                                    User Role
                                </span>
                                <span className="font-medium capitalize text-headingTextColor dark:text-darkTextPrimary">
                                    {String(data?.role || "employee").replaceAll("_", " ")}
                                </span>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default SingleMemberPage;
