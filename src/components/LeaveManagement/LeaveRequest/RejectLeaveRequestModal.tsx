"use client"
import { Button } from "@/components/ui/button";
import {
    DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { leaveRejectRequestSchema } from "@/zod/schema";
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
import { Textarea } from "@/components/ui/textarea";

const RejectLeaveRequestModal = () => {
    const project = ["Time Tracker", "Quantum Network", "The Shift"];
    const [projectSearch, setProjectSearch] = useState("");

    const filteredProject = project.filter((p) =>
        p.toLowerCase().includes(projectSearch.toLowerCase())
    );


    const form = useForm<z.infer<typeof leaveRejectRequestSchema>>({
        resolver: zodResolver(leaveRejectRequestSchema),
        defaultValues: {
            project: "",
            details: "",
        },
    });

    function onSubmit(values: z.infer<typeof leaveRejectRequestSchema>) {
        console.log(values);
    }

    return (
        <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
                <DialogTitle className="mb-4">Leave request</DialogTitle>
            </DialogHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="project"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Select a reason</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a project" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <Input
                                                    type="text"
                                                    placeholder="Search..."
                                                    className="flex-1 border-none focus:ring-0 focus:outline-none mb-1"
                                                    value={projectSearch}
                                                    onChange={(e) => setProjectSearch(e.target.value)}
                                                />
                                                {filteredProject.map((p) => (
                                                    <SelectItem key={p} value={p}>
                                                        {p}
                                                    </SelectItem>
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
                        name="details"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Details</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Enter details" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex items-center gap-3 w-full">
                        <DialogClose asChild>
                            <Button variant="outline2">Cancel</Button>
                        </DialogClose>
                            <Button className="  bg-red-500 hover:bg-red-500" type="submit">Reject Request</Button>
                    </div>
                </form>
            </Form>
        </DialogContent>
    );
};

export default RejectLeaveRequestModal;
