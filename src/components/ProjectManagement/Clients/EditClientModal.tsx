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
import { IClients } from "@/global/globalTypes";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useClientsStore } from "@/api/features/clients/clientsCSRStore";
import { useRouter } from "next/navigation";
import { editClient } from "@/actions/clients/clientsAction";
interface EditClientModalProps {
    onClose: () => void
    selectedClient: IClients | null
}
const EditClientModal = ({ onClose, selectedClient }: EditClientModalProps) => {
    console.log('from modal', selectedClient);
    const [loading, setLoading] = useState(false);
    const form = useForm<z.infer<typeof newClientSchema>>({
        resolver: zodResolver(newClientSchema) as Resolver<z.infer<typeof newClientSchema>>,
        defaultValues: {
            name: selectedClient?.name,
            address: selectedClient?.address,
            email: selectedClient?.email,
            phone: selectedClient?.phone,
        },
    })
    useEffect(() => {
        if (selectedClient) {
            form.reset({
                name: selectedClient.name ?? "",
                address: selectedClient.address ?? "",
                email: selectedClient.email ?? "",
                phone: selectedClient.phone ?? "",
            });
        }
    }, [selectedClient, form]);

    async function onSubmit(values: z.infer<typeof newClientSchema>) {
        console.log(values);
        setLoading(true);
        try {
            const res = await editClient({ data: values, id: selectedClient?.id });
            console.log("success:", res);

            if (res?.success) {
                onClose();
                form.reset();
                toast.success(res?.message || "Client edited successfully");
            } else {
                toast.error(res?.message || "Failed to edit client");
            }
        } catch (error: any) {
            console.error("failed:", error);
            toast.error(error?.message || "Something went wrong!");
        } finally {
            setLoading(false);
        }
    }

    return (
        <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
                <DialogTitle className=" mb-4">Edit Client</DialogTitle>
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

                    <Button className=" w-full" disabled={loading} type="submit">{loading ? "Loading..." : "Update Task"}</Button>

                </form>
            </Form>
        </DialogContent>
    );
};

export default EditClientModal;