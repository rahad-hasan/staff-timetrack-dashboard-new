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

const Notification = () => {
    const sections = [
        {
            title: "Project Notifications",
            items: [
                { name: "Notifications Preferences", inApp: true, email: false },
            ],
        }
    ];

    const form = useForm<z.infer<typeof leaveSettingsSchema>>({
        resolver: zodResolver(leaveSettingsSchema),
        defaultValues: {
            paid_leave: 0,
            casual_leave: 0,
            sick_leave: 0,
            maternity_leave: 0,
        },
    });

    function onSubmit(values: z.infer<typeof leaveSettingsSchema>) {
        console.log(values);
    }

    return (
        <div className="rounded-lg border-2 border-borderColor p-3 md:p-4 mt-4 bg-white dark:bg-darkSecondaryBg dark:border-darkBorder">
            {/* <h2 className="text-lg font-semibold mb-6 text-textGray dark:text-darkTextPrimary">Notifications Preferences</h2> */}

            {sections.map((section, idx) => (
                <div
                    key={section.title}
                    className={`rounded-md border border-borderColor dark:border-darkBorder p-3 md:p-4 mb-4`}
                >

                    <div className="flex justify-between items-center text-sm font-semibold text-gray-500 mb-2">
                        <span className="dark:text-darkTextSecondary">Notification Configuration</span>
                        <div className="flex gap-8 dark:text-darkTextPrimary">
                            <span>IN-APP</span>
                            <span>EMAIL</span>
                        </div>
                    </div>

                    <Separator className="mb-3" />

                    <div className="space-y-3">
                        {section.items.map((item) => (
                            <div
                                key={item.name}
                                className="flex justify-between items-center text-sm text-gray-800 dark:text-darkTextPrimary"
                            >
                                <span className="flex-1">{item.name}</span>
                                <div className="flex items-center gap-8">
                                    <Switch defaultChecked={item.inApp} />
                                    <Switch defaultChecked={item.email} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <div className={`rounded-md border border-borderColor dark:border-darkBorder p-3 md:p-4`}>
                <span className="dark:text-darkTextSecondary  text-sm font-semibold text-gray-500">Leave Configuration</span>
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
                        <div className="flex items-center gap-3 w-full pt-3">
                            <Button type="submit">Save Changes</Button>
                            <Button
                                variant="outline2"
                                className="dark:bg-darkPrimaryBg dark:border-darkBorder dark:text-darkTextPrimary"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default Notification;