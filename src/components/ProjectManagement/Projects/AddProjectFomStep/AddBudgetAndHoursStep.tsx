"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { addBudgetAndHoursSchema } from "@/zod/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
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
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input";

interface GeneralInfoStepProps {
    setStep: (step: number) => void;
    handleStepSubmit: (data: any) => void;
}
const AddBudgetAndHoursStep = ({ setStep, handleStepSubmit }: GeneralInfoStepProps) => {

    const form = useForm<z.infer<typeof addBudgetAndHoursSchema>>({
        resolver: zodResolver(addBudgetAndHoursSchema) as Resolver<z.infer<typeof addBudgetAndHoursSchema>>,
        defaultValues: {
            projectType: "",
            rate: 0,
            budgetType: "",
            budgetBasis: "",
        },
    });

    function onSubmit(values: z.infer<typeof addBudgetAndHoursSchema>) {
        console.log(values);
        handleStepSubmit(values);
        setStep(4);
    }
    // Project rate => hourly, fixed
    // if hourly

    // 1. WATCH THE PROJECT TYPE FIELD
    const projectType = form.watch("projectType");
    const isHourlyRate = projectType === "Hourly Rate";

    return (
        <div>
            <h2 className=" text-xl font-semibold mb-4">Add Budget & Hours</h2>
            <div className="flex gap-3">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
                        <FormField
                            control={form.control}
                            name="projectType"
                            render={({ field }) => (
                                <FormItem className=" w-full">
                                    <FormLabel>Project Type</FormLabel>
                                    <FormControl className="">
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger className=" w-full">
                                                <SelectValue placeholder="Select project type" />
                                            </SelectTrigger>
                                            <SelectContent className=" cursor-pointer">
                                                <SelectGroup>
                                                    <SelectItem className=" cursor-pointer" value="Hourly Rate">Hourly Rate</SelectItem>
                                                    <SelectItem className=" cursor-pointer" value="Fixed Budget">Fixed Budget</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="rate"
                            render={({ field }) => (
                                <FormItem>
                                    {
                                        projectType === "Fixed Budget" ?
                                            <FormLabel>Fixed Rate</FormLabel>
                                            :
                                            <FormLabel>Hourly Rate</FormLabel>
                                    }
                                    <FormControl  className="dark:bg-darkPrimaryBg dark:border-darkBorder">
                                        <Input type="number" className="" placeholder="Project rate" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {
                            isHourlyRate &&
                            <div className=" flex items-center gap-3">
                                <FormField
                                    control={form.control}
                                    name="budgetType"
                                    render={({ field }) => (
                                        <FormItem className=" w-full">
                                            <FormLabel>Budget Type</FormLabel>
                                            <FormControl className="">
                                                <Select
                                                    value={field.value === undefined ? "" : field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger className=" w-full">
                                                        <SelectValue placeholder="Select budget type" />
                                                    </SelectTrigger>
                                                    <SelectContent className=" cursor-pointer">
                                                        <SelectGroup>
                                                            <SelectItem className=" cursor-pointer" value="apple">Hourly Rate</SelectItem>
                                                            <SelectItem className=" cursor-pointer" value="banana">Fixed Budget</SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="budgetBasis"
                                    render={({ field }) => (
                                        <FormItem className=" w-full">
                                            <FormLabel>Budget Basis</FormLabel>
                                            <FormControl className="">
                                                <Select
                                                    value={field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger className=" w-full">
                                                        <SelectValue placeholder="Select budget basis" />
                                                    </SelectTrigger>
                                                    <SelectContent className=" cursor-pointer">
                                                        <SelectGroup>
                                                            <SelectItem className=" cursor-pointer" value="apple">Hourly Rate</SelectItem>
                                                            <SelectItem className=" cursor-pointer" value="banana">Fixed Budget</SelectItem>
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        }

                        <Button className="w-full" type="submit">
                            Next
                        </Button>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default AddBudgetAndHoursStep;