"use client"
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useForm } from "react-hook-form";
import Image from "next/image";
import logo from '../../../assets/logo.svg'
import createNewPasswordIcon from '../../../assets/auth/createNewPasswordIcon.svg'
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createNewPasswordSchema } from "@/zod/schema";

const CreateNewPassword = () => {
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm<z.infer<typeof createNewPasswordSchema>>({
        resolver: zodResolver(createNewPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    })

    function onSubmit(values: z.infer<typeof createNewPasswordSchema>) {
        console.log(values)
    }

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    return (
        <div className=" w-full">
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
                    <form style={{ boxShadow: "0px 10px 180px rgba(18, 205, 105, 0.3)" }} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-white dark:bg-darkPrimaryBg py-8 px-6 md:px-10 rounded-lg border border-borderColor dark:border-darkBorder">
                        <div className=" flex flex-col items-center mb-5">
                            <Image src={createNewPasswordIcon} width={200} height={200} alt="icon" className=" w-16" />
                            <h2 className=" text-2xl font-semibold mt-4 mb-2">Create your password</h2>
                            <p className="">Must be at least 8 character.</p>
                        </div>
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Create new password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                className="w-[300px] sm:w-[400px] dark:border-darkBorder"
                                                placeholder="new password"
                                                {...field}
                                            />
                                            <div
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                                onClick={togglePasswordVisibility}
                                            >
                                                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirm your password</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type={showPassword ? "text" : "password"}
                                                className="w-[300px] sm:w-[400px] dark:border-darkBorder"
                                                placeholder="confirm password"
                                                {...field}
                                            />
                                            <div
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                                onClick={togglePasswordVisibility}
                                            >
                                                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Link href={`/`}>
                            <Button className=" w-full" type="submit">Set New password</Button>
                        </Link>
                    </form>
                </Form>
            </div>
        </div>
    );
};

export default CreateNewPassword;