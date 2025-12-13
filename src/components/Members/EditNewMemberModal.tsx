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
import { ITeamMembers } from "@/global/globalTypes";
interface EditNewMemberModalProps {
    onClose: () => void
    selectedUser: ITeamMembers | null
}
const EditNewMemberModal = ({ onClose, selectedUser }: EditNewMemberModalProps) => {
    console.log('user details', selectedUser);
    const manager = ["admin", "manager", "hr", "project_manager", "employee"];
    const [managerSearch, setManagerSearch] = useState("");

    const filteredManager = manager.filter(t => t.toLowerCase().includes(managerSearch.toLowerCase()));

    const form = useForm<z.infer<typeof addNewMemberSchema>>({
        resolver: zodResolver(addNewMemberSchema),
        defaultValues: {
            name: selectedUser?.name,
            email: selectedUser?.email,
            role: selectedUser?.role,
            password: "",
        },
    })
    useEffect(() => {
        if (selectedUser) {
            form.reset({
                name: selectedUser.name ?? "",
                email: selectedUser.email ?? "",
                role: selectedUser.role ?? "",
                password: "",
            });
        }
    }, [selectedUser, form]);
    function onSubmit(values: z.infer<typeof addNewMemberSchema>) {
        console.log(values)
    }

    return (
        <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
                <DialogTitle className=" mb-4">Edit Member</DialogTitle>
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
                                    <Input type="password" className="dark:bg-darkPrimaryBg dark:border-darkBorder" placeholder="Set Password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {/* <DialogClose asChild> */}
                    <Button className=" w-full" type="submit">Submit</Button>
                    {/* </DialogClose> */}
                </form>
            </Form>
        </DialogContent>
    );
};

export default EditNewMemberModal;