/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { loginSchema } from "@/zod/schema";
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod";
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form";
import loginIcon from '../../../assets/auth/loginIcon.svg'
import Image from "next/image";
import logo from '../../../assets/logo.svg'
import signInImage from '../../../assets/auth/signImage.webp'
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner"
import Cookies from "js-cookie";
import { logIn } from "@/actions/auth/action";

const SignIn = () => {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const router = useRouter();
    // session expire
    const params = useSearchParams();
    const reason = params.get("reason");
    useEffect(() => {
        if (reason === "session_expired") {
            toast.error("Session expired. Please login again.");
            Cookies.remove("refreshToken");
        }
    }, [reason]);

    const form = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    const togglePasswordVisibility = () => {
        setShowPassword((prev) => !prev);
    };

    // const { logIn, isLogging } = useAuthStore();
    // const currentError = useAuthStore.getState().error;
    // console.log(getUser());
    // console.log(getError());

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        setLoading(true);
        try {
            const res: any = await logIn(values);
            console.log("Login success:", res);

            if (res?.success) {
                // Cookies.set("accessToken", res?.data?.accessToken);
                // Cookies.set("refreshToken", res?.data?.refreshToken);
                toast.success(res?.message || "Login successful");
                router.push("/dashboard");
            } else {
                toast.error(res?.message || "Invalid credentials");
            }
        } catch (error: any) {
            console.error("Login failed:", error);
            toast.error(error.message || "Server is not active");
        } finally {
            setLoading(false);
        }
    }

    const sliderContent = [
        {
            titleLine1: "Join Trakkers – Streamline",
            titleLine2: "Your Productivity Today!",
            body: "Sign up for our powerful time tracker and take control of your teams operations with ease. Manage teams relationships, track work, and boost productivity—all in one intuitive platform. Get started today!",
        },
        {
            titleLine1: "Effortless Time",
            titleLine2: "Tracking & Reporting",
            body: "Lorem Ipsum, giving information on its origins Automatically log your working hours, categorize tasks by project, and generate precise reports instantly. Focus on your work, not the clock.",
        },
        {
            titleLine1: "Seamless Team",
            titleLine2: "Collaboration",
            body: "Lorem Ipsum, giving information on its origins Coordinate efforts, share updates, and assign tasks across your entire organization without missing a beat. Trakkers keeps everyone aligned and accountable.",
        },
    ];

    // const totalSlides = sliderContent.length;

    // const nextSlide = () => {
    //     setCurrentSlide((prev) => (prev + 1) % totalSlides);
    // };

    // const prevSlide = () => {
    //     setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    // };

    const currentItem = sliderContent[currentSlide];
    return (
        <div className=" h-auto lg:h-screen w-full flex flex-col lg:flex-row bg-gradient-to-b from-[#12cd6918] from-5% to-[#f6f7f9] dark:to-darkSecondaryBg to-20%">
            <div className=" lg:w-1/2 h-screen lg:h-full">
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
                <div className="  flex justify-center items-center h-[80%]">
                    <div>
                        <div className=" flex flex-col items-center mb-5">
                            <Image src={loginIcon} width={200} height={200} alt="icon" className=" w-16" />
                            <h2 className=" text-2xl font-medium mt-4 mb-2">Sign in</h2>
                            <p className="">Enter your details to sign in</p>
                        </div>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 ">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem className="">
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" className="w-[300px] sm:w-[400px] dark:border-darkBorder" placeholder="Email" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <div className=" flex items-center justify-between">
                                                <FormLabel>Password</FormLabel>
                                                <Link href={`/auth/forgot-password`}>
                                                    <p className=" text-sm text-primary cursor-pointer">Forgot Password?</p>
                                                </Link>
                                            </div>

                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        type={showPassword ? "text" : "password"}
                                                        className="w-[300px] sm:w-[400px] dark:border-darkBorder"
                                                        placeholder="Password"
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
                                {/* <Link href={`/dashboard`}> */}
                                <Button disabled={loading} className=" w-full" type="submit">{loading ? "Loading..." : "Sign in"}</Button>
                                {/* <Button className=" w-full" type="submit">{"Sign in"}</Button> */}
                                {/* </Link> */}
                                <h3 className=" text-center mt-2">Don’t have a account? <span className=" text-primary cursor-pointer">Sign Up</span></h3>
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
            <div className={`hidden lg:block lg:w-1/2 h-screen lg:h-full p-5 relative`}>
                <div className={`w-full h-full rounded-xl bg-cover bg-center bg-no-repeat relative`}
                    style={{ backgroundImage: `url('${signInImage.src}')` }}>
                    <div
                        className="relative w-full h-full"
                    >
                        <div
                            className="bg-[#61616157] text-white py-10 xl:py-12 px-5 xl:px-10 text-center rounded-xl absolute bottom-0 left-0 right-0 backdrop-blur"
                        >
                            <h2 className="text-4xl xl:text-5xl text-center mb-2">{currentItem.titleLine1}</h2>
                            <h2 className="text-4xl xl:text-5xl text-center mb-5">{currentItem.titleLine2}</h2>
                            <p className="text-lg 2xl:px-20">{currentItem.body}</p>

                            <div className="flex justify-center mt-6 space-x-2">
                                {sliderContent.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentSlide(index)}
                                        className={`h-2 w-2 rounded-full transition-all duration-300 cursor-pointer ${index === currentSlide ? 'bg-white w-6' : 'bg-white/40'
                                            }`}
                                        aria-label={`Go to slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                        {/* 
                        <button
                            onClick={prevSlide}
                            className="absolute top-1/2 left-0 z-10 p-2 transform -translate-y-1/2 text-white/80 hover:text-white"
                            aria-label="Previous Slide"
                        >
                            <svg className="h-6 w-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute top-1/2 right-0 z-10 p-2 transform -translate-y-1/2 text-white/80 hover:text-white"
                            aria-label="Next Slide"
                        >
                            <svg className="h-6 w-6 " fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                        </button> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignIn;