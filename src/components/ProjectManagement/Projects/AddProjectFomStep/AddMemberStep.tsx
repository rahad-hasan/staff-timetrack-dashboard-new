// import { Button } from "@/components/ui/button";
import { addMemberSchema } from "@/zod/schema";
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
    MultiSelect,
    MultiSelectContent,
    MultiSelectGroup,
    MultiSelectItem,
    MultiSelectTrigger,
    MultiSelectValue,
} from "@/components/ui/multi-select"
// import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useProjectFormStore } from "@/store/ProjectFormStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GeneralInfoStepProps {
    setStep: (step: number) => void;
}

const AddMemberStep = ({ setStep }: GeneralInfoStepProps) => {
    const data = useProjectFormStore(state => state.data);
    const form = useForm<z.infer<typeof addMemberSchema>>({
        resolver: zodResolver(addMemberSchema),
        defaultValues: {
            manager: data.manager ?? [],
        },
    });

    const { updateData } = useProjectFormStore();
    function onSubmit(values: z.infer<typeof addMemberSchema>) {
        updateData(values);
        setStep(3);
    }

    const managersData = data?.members;

    return (
        <div>
            <h2 className=" text-xl font-medium mb-4 text-headingTextColor dark:text-darkTextPrimary">Add Manager</h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="manager"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Manager</FormLabel>
                                <FormControl>
                                    <MultiSelect
                                        values={field.value?.map(String) || []}
                                        onValuesChange={(vals) =>
                                            field.onChange(vals.map(Number))
                                        }
                                    >
                                        <MultiSelectTrigger className=" w-full hover:bg-white py-2 dark:bg-darkSecondaryBg hover:dark:bg-darkSecondaryBg">
                                            <MultiSelectValue placeholder="Select managers..." />
                                        </MultiSelectTrigger>
                                        <MultiSelectContent className="dark:bg-darkSecondaryBg">
                                            {/* Items must be wrapped in a group for proper styling */}
                                            <MultiSelectGroup className="dark:bg-darkSecondaryBg">
                                                {managersData.map((manager: { id: number | string; image?: string | null; name: string }) => (
                                                    <MultiSelectItem
                                                        key={manager.id}
                                                        value={String(manager.id)}
                                                        className=" px-0 cursor-pointer hover:dark:bg-darkPrimaryBg"
                                                    >
                                                        <Avatar>
                                                            <AvatarImage src={manager.image || ""} />
                                                            <AvatarFallback>
                                                                {manager.name.charAt(0)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <p>{manager.name}</p>
                                                    </MultiSelectItem>
                                                ))}

                                            </MultiSelectGroup>
                                        </MultiSelectContent>
                                    </MultiSelect>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className=" flex items-center justify-between gap-3">
                        <button onClick={() => setStep(1)} className=" bg-primary rounded-lg text-white p-2 cursor-pointer" type="button"><ChevronLeft size={25} /></button>
                        <button className=" bg-primary rounded-lg text-white p-2 cursor-pointer" type="submit"><ChevronRight size={25} /></button>
                    </div>
                </form>
            </Form>
        </div>
    );
};

export default AddMemberStep;