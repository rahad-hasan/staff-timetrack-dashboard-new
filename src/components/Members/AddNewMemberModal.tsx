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
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { addMember } from "@/actions/members/action";

const AddNewMemberModal = ({ onClose }: { onClose: () => void }) => {
    const [loading, setLoading] = useState(false);
    const manager = ["admin", "manager", "hr", "project_manager", "employee"];
    const [managerSearch, setManagerSearch] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const filteredManager = manager.filter(t => t.toLowerCase().includes(managerSearch.toLowerCase()));

    const form = useForm<z.infer<typeof addNewMemberSchema>>({
        resolver: zodResolver(addNewMemberSchema),
        defaultValues: {
            name: "",
            email: "",
            role: "",
            password: "",
        },
    })

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };
    async function onSubmit(values: z.infer<typeof addNewMemberSchema>) {

        setLoading(true);
        try {
            const res = await addMember(values);

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


    return (
        <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
                <DialogTitle className=" mb-4">Add Member</DialogTitle>
            </DialogHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 ">
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
                    {/* <DialogClose asChild> */}
                    <Button disabled={loading} className=" w-full" type="submit">{loading ? "Loading..." : "Add Member"}</Button>
                    {/* <Button className=" w-full" type="submit">{"Add Member"}</Button> */}
                    {/* </DialogClose> */}
                </form>
            </Form>
        </DialogContent>
    );
};

export default AddNewMemberModal;