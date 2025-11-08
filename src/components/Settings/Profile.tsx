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
import { useState } from "react";
import Image from "next/image";
import { Briefcase, Mail, Upload, User } from "lucide-react";
import profileAvatar from '../../assets/profile_image_avatar.webp';
import { Label } from "@/components/ui/label";

const Profile = () => {
    const [preview, setPreview] = useState(profileAvatar)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => setPreview(reader.result as any)
            reader.readAsDataURL(file)
        }
    }

    const form = useForm<z.infer<typeof userBasicInfoSchema>>({
        resolver: zodResolver(userBasicInfoSchema),
        defaultValues: {
            name: "",
            title: "",
            email: "",
            // password: "",
        },
    });

    function onSubmit(values: z.infer<typeof userBasicInfoSchema>) {
        console.log(values);
    }

    return (
        <div className=" rounded-lg border-2 border-borderColor dark:border-darkBorder p-4 mt-4">
            <h2 className=" text-lg mb-4 dark:text-darkTextPrimary">Basic Information</h2>
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
                    <p className="font-medium dark:text-darkTextPrimary">Profile Picture</p>
                    <p className="text-sm text-gray-500 mb-3 dark:text-darkTextPrimary">400px, JPG or PNG, max 200kb</p>
                    <Label
                        htmlFor="photo-upload"
                        className="cursor-pointer flex items-center gap-2 text-sm font-medium border rounded-md px-3 py-1.5 hover:bg-gray-50 dark:bg-darkPrimaryBg"
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

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-3">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                        <div className="relative ">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
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
                                <FormItem className="w-full">
                                    <FormLabel>Job Title</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                                            <Input
                                                type="text"
                                                placeholder="Job Title"
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

                    <div className="flex items-center gap-3">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Email Address</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                                            <Input
                                                type="email"
                                                placeholder="Email Address"
                                                className="pl-9 dark:bg-darkPrimaryBg dark:border-darkBorder"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="hidden sm:block w-full"></div>
                        {/* <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                                            <Input
                                                type="password"
                                                placeholder="Password"
                                                className="pl-9"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        /> */}
                    </div>

                    <div className="border-b-2 pb-8 mt-2">
                        <h2 className=" text-lg sm:text-2xl font-semibold mb-3 dark:text-darkTextPrimary">Team Role</h2>
                        <Button
                            className="bg-[#f5f6f6] text-black hover:bg-gray-100 dark:text-darkTextPrimary dark:border-darkBorder"
                            variant={"outline2"}
                            size={"sm"}
                        >
                            Owner in tracker.org
                        </Button>


                    </div>

                    <div className="flex items-center gap-3 w-full pt-3">
                        <Button type="submit">Save Changes</Button>
                        <Button variant="outline2" className=" dark:bg-darkPrimaryBg dark:border-darkBorder dark:text-darkTextPrimary">Cancel</Button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default Profile;