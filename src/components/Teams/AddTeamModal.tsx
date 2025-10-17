"use client"
import { Button } from "@/components/ui/button";
import {
    // DialogClose,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { newTeamSchema } from "@/zod/schema";
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
import {
    MultiSelect,
    MultiSelectContent,
    MultiSelectGroup,
    MultiSelectItem,
    MultiSelectTrigger,
    MultiSelectValue,
} from "@/components/ui/multi-select"
import Image from "next/image";

const AddTeamModal = () => {

    const manager = ["Website Design", "Working on App Design", "New Landing Page", "Work on helsenist Project"];
    const [managerSearch, setManagerSearch] = useState("");

    const filteredManager = manager.filter(t => t.toLowerCase().includes(managerSearch.toLowerCase()));

    const form = useForm<z.infer<typeof newTeamSchema>>({
        resolver: zodResolver(newTeamSchema),
        defaultValues: {
            teamName: "",
            project: "",
            members: [],
        },
    })

    function onSubmit(values: z.infer<typeof newTeamSchema>) {
        console.log(values)
    }

    const memberData = [
        { name: "Kalki Noland", image: "https://avatar.iran.liara.run/public/18" },
        { name: "Minakshi Devi", image: "https://avatar.iran.liara.run/public/25" },
        { name: "Dani Wolvarin", image: "https://avatar.iran.liara.run/public/20" },
        { name: "Alex Johnson", image: "https://avatar.iran.liara.run/public/22" },
    ]

    return (
        <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
                <DialogTitle className=" mb-4">Add Team</DialogTitle>
            </DialogHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 ">
                    <FormField
                        control={form.control}
                        name="teamName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Team Name</FormLabel>
                                <FormControl>
                                    <Input type="text" className="" placeholder="Team Name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="project"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Assign Project</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger className="w-full">
                                                <div className=" flex gap-1 items-center">
                                                    <SelectValue className=" text-start" placeholder="Select Project" />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <Input
                                                    type="text"
                                                    placeholder="Select Project"
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
                        name="members"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Members</FormLabel>
                                <FormControl>
                                    <MultiSelect
                                        values={field.value}
                                        onValuesChange={field.onChange}
                                    >
                                        <MultiSelectTrigger className=" w-full hover:bg-white py-2">
                                            <MultiSelectValue placeholder="Select frameworks..." />
                                        </MultiSelectTrigger>
                                        <MultiSelectContent>
                                            {/* Items must be wrapped in a group for proper styling */}
                                            <MultiSelectGroup>
                                                {
                                                    memberData?.map((member, i) => (

                                                        <MultiSelectItem className=" px-0 cursor-pointer" key={i} value={member?.name}>
                                                            <Image src={member?.image} className=" w-8" width={200} height={200} alt="profile_image" />
                                                            <p>{member?.name}</p>
                                                        </MultiSelectItem>
                                                    ))
                                                }

                                            </MultiSelectGroup>
                                        </MultiSelectContent>
                                    </MultiSelect>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {/* <DialogClose asChild> */}
                    <Button className=" w-full" type="submit">Create Task</Button>
                    {/* </DialogClose> */}
                </form>
            </Form>
        </DialogContent>
    );
};

export default AddTeamModal;