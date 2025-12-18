"use client"

// import { Button } from "@/components/ui/button";
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
import { ChevronLeft } from "lucide-react";
import { useProjectFormStore } from "@/store/ProjectFormStore";

interface GeneralInfoStepProps {
    setStep: (step: number) => void;
}
const AddBudgetAndHoursStep = ({ setStep }: GeneralInfoStepProps) => {

    const { data } = useProjectFormStore(state => state);
    console.log('gettting from zustand', data);
    const form = useForm<z.infer<typeof addBudgetAndHoursSchema>>({
        resolver: zodResolver(addBudgetAndHoursSchema) as Resolver<z.infer<typeof addBudgetAndHoursSchema>>,
        defaultValues: {
            budgetType: data.budgetType ?? "",
            rate: data.rate ?? undefined,
            basedOn: data.basedOn ?? "",
        },
    });

    const { updateData } = useProjectFormStore();
    function onSubmit(values: z.infer<typeof addBudgetAndHoursSchema>) {
        updateData(values);
        console.log(values);
        // setStep(4);
    }
    // Project rate => hourly, fixed
    // if hourly

    // 1. WATCH THE PROJECT TYPE FIELD
    const budgetType = form.watch("budgetType");
    const isHourlyRate = budgetType === "Hourly Rate";

    return (
        <div>
            <h2 className=" text-xl font-medium mb-4 text-headingTextColor dark:text-darkTextPrimary">Add Budget & Hours</h2>
            <div className="flex gap-3">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
                        <FormField
                            control={form.control}
                            name="budgetType"
                            render={({ field }) => (
                                <FormItem className=" w-full">
                                    <FormLabel>Budget Type</FormLabel>
                                    <FormControl className="">
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger className=" w-full">
                                                <SelectValue placeholder="Select Budget type" />
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
                                        budgetType === "Fixed Budget" ?
                                            <FormLabel>Fixed Rate</FormLabel>
                                            :
                                            <FormLabel>Hourly Rate</FormLabel>
                                    }
                                    <FormControl className="dark:bg-darkPrimaryBg dark:border-darkBorder">
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
                                    name="basedOn"
                                    render={({ field }) => (
                                        <FormItem className=" w-full">
                                            <FormLabel>Based on</FormLabel>
                                            <FormControl className="">
                                                <Select
                                                    value={field.value === undefined ? "" : field.value}
                                                    onValueChange={field.onChange}
                                                >
                                                    <SelectTrigger className=" w-full">
                                                        <SelectValue placeholder="Select based on" />
                                                    </SelectTrigger>
                                                    <SelectContent className=" cursor-pointer">
                                                        <SelectGroup>
                                                            <SelectItem className=" cursor-pointer" value="Employee Pay Rate">Employee Pay Rate</SelectItem>
                                                            <SelectItem className=" cursor-pointer" value="Project Pay Rate">Project Pay Rate</SelectItem>
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
                        <div className=" flex items-center justify-between gap-3">
                            <button onClick={() => setStep(2)} className=" bg-primary rounded-lg text-white p-2 cursor-pointer" type="button"><ChevronLeft size={25} /></button>
                            {/* <DialogClose asChild> */}
                            <button className=" bg-primary rounded-lg text-white py-2 px-3 cursor-pointer" type="submit">Create Project</button>
                            {/* </DialogClose> */}
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default AddBudgetAndHoursStep;