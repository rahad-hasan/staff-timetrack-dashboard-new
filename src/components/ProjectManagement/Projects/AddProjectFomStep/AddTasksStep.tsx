/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addTasksSchema } from "@/zod/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Resolver, useForm } from "react-hook-form";
import z from "zod";


interface GeneralInfoStepProps {
    handleStepSubmit: (data: any) => void;
}
const AddTasksStep = ({ handleStepSubmit }: GeneralInfoStepProps) => {

    const form = useForm<z.infer<typeof addTasksSchema>>({
        resolver: zodResolver(addTasksSchema) as Resolver<z.infer<typeof addTasksSchema>>,
        defaultValues: {
            tasks: "",
            description: "",
        },
    });

    function onSubmit(values: z.infer<typeof addTasksSchema>) {
        handleStepSubmit(values);
    }
    return (
        <div>
            <h2 className=" text-xl font-medium mb-4">Add Tasks</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
                    <FormField
                        control={form.control}
                        name="tasks"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tasks</FormLabel>
                                <FormControl>
                                    <Input type="text" className="dark:bg-darkPrimaryBg dark:border-darkBorder" placeholder="Task title" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea className="dark:border-darkBorder" placeholder="Add Description" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogClose asChild>
                        <Button className="w-full" type="submit">
                            Create Project
                        </Button>
                    </DialogClose>
                </form>
            </Form>
        </div>
    );
};

export default AddTasksStep;