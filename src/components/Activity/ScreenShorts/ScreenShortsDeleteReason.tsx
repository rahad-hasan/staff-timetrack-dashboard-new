import { DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog";
import BlockLogo from '../../../assets/activity/blockAppUrl.svg'
import Image from "next/image";
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
import { screenDeleteReasonSchema } from "@/zod/schema";

const ScreenShortsDeleteReason = () => {

    const form = useForm<z.infer<typeof screenDeleteReasonSchema>>({
        resolver: zodResolver(screenDeleteReasonSchema) as Resolver<z.infer<typeof screenDeleteReasonSchema>>,
        defaultValues: {
            reason: "",
        },
    })

    function onSubmit(values: z.infer<typeof screenDeleteReasonSchema>) {
        console.log(values)
    }

    return (
        <DialogContent className="sm:max-w-[425px]">
            <DialogTitle></DialogTitle>
            <div className=" flex items-center justify-center">
                <Image src={BlockLogo} className=" w-16" alt="block logo" width={300} height={300} />
            </div>
            <div className="">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 ">
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason</FormLabel>
                                    <FormControl>
                                        <Input type="text" className="dark:bg-darkPrimaryBg dark:border-darkBorder" placeholder="Write reason" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className=" flex items-center gap-2 justify-center">
                            <DialogClose asChild>
                                <button

                                    className={` w-[100px] py-1.5 flex items-center justify-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 border border-borderColor`}>
                                    No Cancel
                                </button>
                            </DialogClose>
                            <button
                                className={` w-[100px] py-1.5 flex items-center justify-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 bg-[#f40139] text-white`}>
                                Delete
                            </button>
                        </div>
                    </form>
                </Form>
            </div>

        </DialogContent>
    );
};

export default ScreenShortsDeleteReason;