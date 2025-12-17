/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { Button } from "@/components/ui/button";
import {
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { newClientSchema } from "@/zod/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Resolver, useForm } from "react-hook-form";
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
import { useClientsStore } from "@/api/features/clients/clientsCSRStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const AddClientModal = ({ onClose }: { onClose: () => void }) => {

    const form = useForm<z.infer<typeof newClientSchema>>({
        resolver: zodResolver(newClientSchema) as Resolver<z.infer<typeof newClientSchema>>,
        defaultValues: {
            name: "",
            address: "",
            email: "",
            phone: ""
        },
    })
    const router = useRouter();

    const { addClient, isClientAdding } = useClientsStore();
    function onSubmit(values: z.infer<typeof newClientSchema>) {
        console.log(values)
        addClient(values)
            .then((res: any) => {
                console.log("success:", res);
                if (!res?.success) {
                    toast.error(res?.message)
                }
                if (res?.success) {
                    onClose();
                    form.reset()
                    toast.success(res?.message)
                    router.refresh();
                }
                // const currentError = useAuthStore.getState().error;
                // console.log("Updated error:", currentError);
                // console.log(error);
            })
            .catch((error) => {
                console.error("failed:", error);
            });
    }

    return (
        <DialogContent
            onInteractOutside={(event) => event.preventDefault()}
            className="sm:max-w-[525px]">
            <DialogHeader>
                <DialogTitle className=" mb-4 text-headingTextColor dark:text-darkTextPrimary">Add New Client</DialogTitle>
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
                                    <Input type="text" className="dark:bg-darkPrimaryBg dark:border-darkBorder" placeholder="Client Name" {...field} />
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
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                    <Input type="text" className="dark:bg-darkPrimaryBg dark:border-darkBorder" placeholder="Enter Address" {...field} />
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
                                    <Input type="text" className="dark:bg-darkPrimaryBg dark:border-darkBorder" placeholder="Enter Email" {...field} />
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
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                    <Input
                                        type="text"
                                        placeholder="Enter Phone Number"
                                        className="dark:bg-darkPrimaryBg dark:border-darkBorder"
                                        {...field}
                                        onChange={(e) => {
                                            // This Regex allows ONLY the '+' sign and numbers 0-9
                                            // It replaces any other character (like 'a', 'b', '!', etc.) with an empty string
                                            const sanitizedValue = e.target.value.replace(/[^\d+]/g, "");
                                            field.onChange(sanitizedValue);
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {/* <DialogClose asChild> */}
                    <Button className="w-full" disabled={isClientAdding} type="submit">{isClientAdding ? "Loading..." : "Create Task"}</Button>
                    {/* </DialogClose> */}
                </form>
            </Form>
        </DialogContent>
    );
};

export default AddClientModal;