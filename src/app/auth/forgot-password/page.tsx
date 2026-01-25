/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { forgetPasswordSchema } from "@/zod/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useForm } from "react-hook-form";
import Image from "next/image";
import logo from '../../../assets/logo.svg'
import roundedEmail from '../../../assets/auth/roundedEmail.svg'
import { useState } from "react";
import { toast } from "sonner";
import { forgetPassword } from "@/actions/auth/action";
import { useRouter } from "next/navigation";

const ForgotPassword = () => {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const form = useForm<z.infer<typeof forgetPasswordSchema>>({
        resolver: zodResolver(forgetPasswordSchema),
        defaultValues: {
            email: "",
        },
    })

    async function onSubmit(values: z.infer<typeof forgetPasswordSchema>) {
        setLoading(true);
        try {
            const res = await forgetPassword({ data: values });
            if (res?.success) {
                toast.success(res?.message || "OTP sent to your email");
                router.push(`/auth/${res?.data?.redirect}?email=${values.email}`);
            } else {
                toast.error(res?.message || "Invalid credentials");
            }
        } catch (error: any) {
            toast.error(error.message || "Server is not active");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className=" w-full dark:bg-darkSecondaryBg">
            <div className=" w-full flex items-center justify-center">

                <div
                    className={`flex items-center gap-1.5 px-8 py-5 `}
                >
                    <Image
                        src={logo}
                        alt="Logo"
                        width={0}
                        height={0}
                        className={`w-12 h-12`}
                    />
                    <h2 className="text-2xl font-bold">Tracker</h2>
                </div>
            </div>
            <div className=" h-[80vh] flex items-center justify-center">

                <Form {...form}>
                    <form style={{ boxShadow: "0px 10px 180px rgba(18, 205, 105, 0.3)" }} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-white dark:bg-darkPrimaryBg py-10 px-6 md:px-10 rounded-lg border border-borderColor dark:border-darkBorder">
                        <div className=" flex flex-col items-center mb-5">
                            <Image src={roundedEmail} width={200} height={200} alt="icon" className=" w-16" />
                            <h2 className=" text-2xl font-medium mt-4 mb-2">Forgot password</h2>
                            <p className="">Please enter your Email address</p>
                        </div>
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" className="w-[300px] sm:w-[400px] md:h-12 dark:border-darkBorder" placeholder="Email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        {/* <Link href={`/auth/forget-password-verify-otp`}> */}
                        <Button disabled={loading} className=" w-full" type="submit">{loading ? "Loading..." : "Send Code"}</Button>
                        {/* </Link> */}
                        {/* <h3 className=" text-center mt-3">Don’t have a account? <span className=" text-primary cursor-pointer">Sign Up</span></h3> */}
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default ForgotPassword;