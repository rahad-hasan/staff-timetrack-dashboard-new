/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { changePasswordSchema } from "@/zod/schema";
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
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { changePassword } from "@/actions/auth/action";

const ChangePassword = () => {
    const [loading, setLoading] = useState(false);
    const form = useForm<z.infer<typeof changePasswordSchema>>({
        resolver: zodResolver(changePasswordSchema),
        defaultValues: {
            oldPassword: "",
            newPassword: "",
        },
    });

    async function onSubmit(values: z.infer<typeof changePasswordSchema>) {
        setLoading(true);
        try {
            const res = await changePassword({ data: values });
            
            if (res?.success) {
                toast.success(res?.message || "Changed password successfully");
                form.reset();
            } else {
                toast.error(res?.message || "Failed to change password");
            }
        } catch (error: any) {
            toast.error(error.message || "Something went wrong!");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="xl:w-[50%] rounded-lg border border-borderColor p-3 md:p-4 mt-4 bg-white dark:bg-darkSecondaryBg dark:border-darkBorder">
            <div className="rounded-md border border-borderColor dark:border-darkBorder p-3 md:p-4 mb-4">
                <span className="text-subTextColor dark:text-darkTextPrimary text-sm font-medium">
                    Security Configuration
                </span>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
                        <FormField
                            control={form.control}
                            name="oldPassword"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Old Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Old Password"
                                            className="dark:bg-darkPrimaryBg dark:border-darkBorder"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="New Password"
                                            className="dark:bg-darkPrimaryBg dark:border-darkBorder"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center gap-3 w-full pt-3 border-t dark:border-darkBorder">
                            <Button type="submit" disabled={loading}>
                                {loading ? "Loading..." : "Update Password"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default ChangePassword;