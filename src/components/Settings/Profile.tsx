"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { userBasicInfoSchema } from "@/zod/schema";
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
import Image from "next/image";
import { Check, ChevronsUpDown, Phone, Upload } from "lucide-react";
import profileAvatar from '../../assets/profile_image_avatar.webp';
import { Label } from "@/components/ui/label";
import UserIcon from "../Icons/UserIcon";
import JobIcon from "../Icons/JobIcon";
import EmailIcon from "../Icons/EmailIcon";
import { useLogInUserStore } from "@/store/logInUserStore";
import { uploadProfileInfo, uploadProfileImage } from "@/actions/auth/action";
import { toast } from "sonner";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { popularTimeZoneList } from "@/utils/TimeZoneList";
import { cn } from "@/lib/utils";

const Profile = () => {
    const { logInUserData } = useLogInUserStore(state => state);
    const [loading, setLoading] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [preview, setPreview] = useState<any>(logInUserData?.image ? logInUserData?.image : profileAvatar)
    const [image, setImage] = useState<any>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setPreview(base64String);
                setImage(base64String);
            };
            // reader.onloadend = () => setPreview(reader.result as any)
            reader.readAsDataURL(file)
        }
    }

    const { updateUserData } = useLogInUserStore();

    const form = useForm<z.infer<typeof userBasicInfoSchema>>({
        resolver: zodResolver(userBasicInfoSchema),
        defaultValues: {
            name: logInUserData?.name ? logInUserData?.name : "",
            title: logInUserData?.role ? logInUserData?.role : "",
            email: logInUserData?.email ? logInUserData?.email : "",
            phone: logInUserData?.phone ? logInUserData?.phone : "",
            time_zone: logInUserData?.timezone || "",
            // password: "",
        },
    });
    useEffect(() => {
        if (!logInUserData) return;

        form.reset({
            name: logInUserData.name ?? "",
            title: logInUserData.role ?? "",
            email: logInUserData.email ?? "",
            phone: logInUserData.phone ?? "",
            time_zone: logInUserData.timezone ?? "",
        });

        setPreview(logInUserData.image || profileAvatar.src);
    }, [logInUserData, form]);


    async function upLoadImage() {
        setImageLoading(true);
        try {
            const res = await uploadProfileImage({ data: { image: image } });
            if (res?.success) {
                toast.success(res?.message || "Image updated successfully");
                updateUserData({
                    image: res?.data?.imageUrl
                })
                setImage(null);
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
            toast.error(error?.message || "Something went wrong!", {
                style: {
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none'
                },
            });
        } finally {
            setImageLoading(false);
        }
    }

    async function onSubmit(values: z.infer<typeof userBasicInfoSchema>) {
        setLoading(true);
        try {
            const finalData = {
                name: values.name,
                phone: values.phone,
                time_zone: values.time_zone,
            };
            const res = await uploadProfileInfo({ data: finalData });

            if (res?.success) {
                toast.success(res?.message || "Profile updated successfully");
                if (logInUserData.role !== "admin") {
                    updateUserData({
                        name: values.name,
                        phone: values.phone,
                        timezone: values.time_zone,
                    });
                }
            } else {
                toast.error(res?.message || "Something went wrong!", {
                    style: {
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none'
                    },
                });
            }
        } catch (error: any) {
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
        <div className=" xl:w-[80%] rounded-lg bg-white dark:bg-darkSecondaryBg border border-borderColor dark:border-darkBorder p-4 mt-4">
            <h2 className=" text-lg mb-4 text-headingTextColor dark:text-darkTextPrimary">Basic Information</h2>
            <div className="flex items-center gap-5 mb-6">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden">
                    <Image
                        src={preview}
                        alt="Profile"
                        width={100}
                        height={100}
                        className="object-cover w-full h-full"
                    />
                </div>
                <div>
                    <p className="font-medium text-headingTextColor dark:text-darkTextPrimary">Profile Picture</p>
                    <p className="text-sm text-subTextColor mb-3 dark:text-darkTextPrimary">400px, JPG or PNG, max 200kb</p>

                    <div className=" flex items-center gap-3">
                        {
                            image &&
                            <Button onClick={upLoadImage} className="h-9" disabled={imageLoading} type="button">{imageLoading ? "Uploading..." : "Upload"}</Button>
                        }

                        <Label
                            htmlFor="photo-upload"
                            className=" w-[150px] cursor-pointer flex items-center justify-center gap-2 text-sm font-medium border rounded-md px-3 py-1.5 hover:bg-gray-50 dark:bg-darkPrimaryBg"
                        >
                            <Upload className="h-4 w-4" />
                            Upload Photo
                            <Input
                                id="photo-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </Label>
                    </div>
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className=" grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3 items-start">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="w-full ">
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" >
                                                <UserIcon size={16} />
                                            </div>
                                            <Input
                                                type="text"
                                                placeholder="Full Name"
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
                            name="title"
                            render={({ field }) => (
                                <FormItem className="w-full ">
                                    <FormLabel>Job Title</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" >
                                                <JobIcon size={16} />
                                            </div>
                                            <Input
                                                type="text"
                                                placeholder="Job Title"
                                                disabled={true}
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

                    <div className="flex flex-col sm:flex-row items-start gap-3">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="w-full ">
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" >
                                                <EmailIcon size={16} />
                                            </div>
                                            <Input
                                                type="email"
                                                placeholder="Email Address"
                                                disabled={true}
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
                                                    // This Regex allows ONLY the '+' sign and numbers 0-9
                                                    // It replaces any other character (like 'a', 'b', '!', etc.) with an empty string
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
                    </div>
                    {
                        logInUserData.role !== "admin" &&
                        <div className="flex items-start gap-3">
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
                            <div className=" hidden sm:block w-full"></div>
                        </div>
                    }

                    <div className="border-b pb-8 mt-2">
                        <h2 className=" text-lg sm:text-2xl font-medium mb-3 text-headingTextColor dark:text-darkTextPrimary">Team Role</h2>
                        <span
                            className=" border bg-[#f5f6f6] px-4 py-1.5 rounded-lg dark:bg-gray-700 text-headingTextColor dark:text-darkTextPrimary dark:border-darkBorder"
                        >
                            {logInUserData.role} in tracker.org
                        </span>
                    </div>

                    <div className="flex items-center gap-3 w-full pt-3">
                        <Button type="submit" disabled={loading}>{loading ? "Loading..." : "Save Changes"}</Button>
                        {/* <Button type="button" variant="outline2" className=" dark:bg-darkPrimaryBg dark:border-darkBorder dark:text-darkTextPrimary">Cancel</Button> */}
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default Profile;