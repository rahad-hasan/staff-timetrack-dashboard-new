/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { Button } from "@/components/ui/button";
import {
    // DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { addNewMemberSchema } from "@/zod/schema";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronsUpDown, Eye, EyeOff, Phone, Search } from "lucide-react";
import { toast } from "sonner";
import { addMember } from "@/actions/members/action";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { popularTimeZoneList } from "@/utils/TimeZoneList";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { useDebounce } from "@/hooks/use-debounce";
import { getProjects } from "@/actions/projects/action";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getAllSchedule } from "@/actions/schedule/action";

const AddNewMemberModal = ({ onClose }: { onClose: () => void }) => {
    type ProjectOption = {
        value: string;
        label: string;
        avatar?: string;
    };
    type ScheduleOption = {
        value: string;
        label: string;
    };
    const [step, setStep] = useState<number>(1);
    const [loading, setLoading] = useState(false);
    const [projectLoading, setProjectLoading] = useState(false);
    const [scheduleLoading, setScheduleLoading] = useState(false);
    const manager = ["admin", "manager", "hr", "project_manager", "employee"];
    const [managerSearch, setManagerSearch] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const filteredManager = manager.filter(t => t.toLowerCase().includes(managerSearch.toLowerCase()));
    const [searchInput, setSearchInput] = useState("");
    const [searchScheduleInput, setSearchScheduleInput] = useState("");
    const [projects, setProjects] = useState<ProjectOption[]>([]);
    const [schedules, setSchedules] = useState<ScheduleOption[]>([]);

    const form = useForm<z.infer<typeof addNewMemberSchema>>({
        resolver: zodResolver(addNewMemberSchema),
        mode: "onChange",
        defaultValues: {
            name: "",
            email: "",
            role: "",
            time_zone: "",
            password: "",
        },
    })

    const debouncedSearch = useDebounce(searchInput, 500);
    useEffect(() => {
        const fetchProjects = async () => {
            setProjectLoading(true);
            try {
                const res = await getProjects({ search: debouncedSearch, app: true });

                if (res?.success) {
                    setProjects(
                        res.data.map((p: any) => ({
                            value: String(p.id),
                            label: p.name,
                            avatar: p.image || "",
                        }))
                    );
                }
            } catch (err) {
                console.error("Fetch projects error:", err);
            } finally {
                setProjectLoading(false);
            }
        };
        fetchProjects();
    }, [debouncedSearch]);

    const debouncedSearchSchedule = useDebounce(searchScheduleInput, 500);
    useEffect(() => {
        const fetchSchedules = async () => {
            setScheduleLoading(true);
            try {
                const res = await getAllSchedule({ search: debouncedSearchSchedule });

                if (res?.success) {
                    setSchedules(
                        res?.data.map((p: any) => ({
                            value: String(p.id),
                            label: p.name,
                        }))
                    );
                }
            } catch (err) {
                console.error("Fetch schedules error:", err);
            } finally {
                setScheduleLoading(false);
            }
        };
        fetchSchedules();
    }, [debouncedSearchSchedule]);

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };
    async function onSubmit(values: z.infer<typeof addNewMemberSchema>) {
        const finalData = {
            email: values.email,
            name: values.name,
            password: values.password,
            pay_rate_hourly: values.pay_rate_hourly,
            phone: values.phone,
            project_id: Number(values.project),
            role: values.role,
            schedule_id: Number(values.schedule),
            time_zone: values.time_zone
        }
        console.log(finalData);
        setLoading(true);
        try {
            const res = await addMember(finalData);

            if (res?.success) {
                form.reset();
                setTimeout(() => {
                    onClose();
                }, 0);
                toast.success(res?.message || "Member added successfully");
            } else {
                toast.error(res?.message || "Failed to add member", {
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
    const handleNext = async () => {
        const valid = await form.trigger(["name", "email", "phone", "role"]);

        if (valid) {
            setStep(2);
        }
    };

    return (
        <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
                <div className=" flex gap-3 items-center mt-5 mb-4">
                    <span className=" h-1.5 rounded-full bg-primary w-full"></span>
                    <span className={` h-1.5 rounded-full ${step >= 2 ? "bg-primary" : "bg-[#dce3e3]"}  w-full `}></span>
                </div>
                <DialogTitle className=" mb-2">Add Member</DialogTitle>
            </DialogHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 ">
                    {
                        step === 1 &&
                        <div className=" space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input type="text" className="dark:bg-darkPrimaryBg dark:border-darkBorder" placeholder="Add member name" {...field} />
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
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input type="text" className="dark:bg-darkPrimaryBg dark:border-darkBorder" placeholder="Enter member email" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem className="w-full ">
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" >
                                                    <Phone size={16} />
                                                </div>
                                                <Input
                                                    type="text"
                                                    placeholder="Enter Phone Number"
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
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger className="w-full">
                                                        <div className=" flex gap-1 items-center">
                                                            <SelectValue className=" text-start" placeholder="Select Role" />
                                                        </div>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <Input
                                                            type="text"
                                                            placeholder="Select Role"
                                                            className="flex-1 border-none focus:ring-0 focus:outline-none"
                                                            value={managerSearch}
                                                            onChange={(e) => setManagerSearch(e.target.value)}
                                                        />
                                                        {filteredManager.map(p => (
                                                            <SelectItem key={p} value={p}>{p}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button
                                type="button"
                                className="w-full"
                                onClick={handleNext}
                            >
                                Next
                            </Button>
                            {/* <Button
                                type="button" // 1. Important: Change this from "submit" to "button"
                                className="w-full"
                                onClick={async () => {
                                    // 2. Optional but recommended: Validate Step 1 fields before proceeding
                                    const isValid = await form.trigger(["name", "email", "phone", "role"]);
                                    console.log(isvalid);
                                    if (isValid) {
                                        setStep(2);
                                    }
                                }}
                            >Next</Button> */}
                        </div>
                    }
                    {
                        step === 2 &&

                        <div className=" space-y-4">
                            <FormField
                                control={form.control}
                                name="time_zone"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col w-full">
                                        <FormLabel>Time Zone</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline2"
                                                        role="combobox"
                                                        className=" flex justify-between dark:text-darkTextPrimary hover:dark:bg-darkPrimaryBg"
                                                    >
                                                        <span className="truncate text-subTextColor dark:text-darkTextSecondary">
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
                                                                        form.setValue("time_zone", tz.value, {
                                                                            shouldValidate: true,
                                                                            shouldDirty: true,
                                                                        });
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
                                name="project"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className={""}>Project</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        // disabled={!selectedAssignee}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full dark:bg-darkSecondaryBg">
                                                    <SelectValue
                                                        placeholder={"Select project"}
                                                    />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="dark:bg-darkSecondaryBg">
                                                <div className="flex items-center px-2 pb-2 pt-1">
                                                    <Search className="mr-2 h-4 w-4 opacity-50" />
                                                    <Input
                                                        placeholder="Search projects..."
                                                        className="h-8 border-none focus-visible:ring-0"
                                                        value={searchInput}
                                                        onKeyDown={(e) => e.stopPropagation()}
                                                        onChange={(e) => setSearchInput(e.target.value)}
                                                    />
                                                </div>
                                                {projects.length === 0 ? (
                                                    <p className="text-sm text-center py-2">
                                                        {loading ? "Loading..." : "No projects found."}
                                                    </p>
                                                ) : (
                                                    projects.map((p) => (
                                                        <SelectItem key={p.value} value={p.value}>
                                                            <div className="flex items-center gap-2">
                                                                {p.avatar && (
                                                                    <Avatar className="h-4 w-4">
                                                                        <AvatarImage src={p.avatar} />
                                                                        <AvatarFallback className="text-[8px]">P</AvatarFallback>
                                                                    </Avatar>
                                                                )}
                                                                {p.label}
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="schedule"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className={""}>Schedule</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        // disabled={!selectedAssignee}
                                        >
                                            <FormControl>
                                                <SelectTrigger className="w-full dark:bg-darkSecondaryBg">
                                                    <SelectValue
                                                        placeholder={"Select schedule"}
                                                    />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="dark:bg-darkSecondaryBg">
                                                <div className="flex items-center px-2 pb-2 pt-1">
                                                    <Search className="mr-2 h-4 w-4 opacity-50" />
                                                    <Input
                                                        placeholder="Search schedules..."
                                                        className="h-8 border-none focus-visible:ring-0"
                                                        value={searchScheduleInput}
                                                        onKeyDown={(e) => e.stopPropagation()}
                                                        onChange={(e) => setSearchScheduleInput(e.target.value)}
                                                    />
                                                </div>
                                                {schedules.length === 0 ? (
                                                    <p className="text-sm text-center py-2">
                                                        {loading ? "Loading..." : "No schedules found."}
                                                    </p>
                                                ) : (
                                                    schedules.map((p) => (
                                                        <SelectItem key={p.value} value={p.value}>
                                                            <div className="flex items-center gap-2">
                                                                {/* {p.avatar && (
                                                            <Avatar className="h-4 w-4">
                                                                <AvatarImage src={p.avatar} />
                                                                <AvatarFallback className="text-[8px]">P</AvatarFallback>
                                                                </Avatar>
                                                        )} */}
                                                                {p.label}
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="pay_rate_hourly"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pay Rate (Hourly)</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                {...field}
                                                className="dark:bg-darkPrimaryBg dark:border-darkBorder" placeholder="10 means 10 dollars per hour"
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
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? "text" : "password"}
                                                    className=" dark:border-darkBorder"
                                                    placeholder="Password"
                                                    {...field}
                                                />
                                                <div
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                                    onClick={togglePasswordVisibility}
                                                >
                                                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                                </div>
                                            </div>
                                            {/* <Input type="password" className="dark:bg-darkPrimaryBg dark:border-darkBorder" placeholder="Set Password" {...field} /> */}
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className=" flex items-center justify-between gap-3">
                                <button onClick={() => setStep(1)} className=" bg-primary rounded-lg text-white p-2 cursor-pointer" type="button"><ChevronLeft size={25} /></button>
                                <button className=" bg-primary rounded-lg text-white py-2 px-3 cursor-pointer" disabled={loading} type="submit">{loading ? "Loading..." : "Add Member"}</button>
                            </div>
                        </div>
                    }
                </form>
            </Form>
        </DialogContent>
    );
};

export default AddNewMemberModal;