/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, ShieldCheck, Star } from "lucide-react";
import { createNewPasswordSchema } from "@/zod/schema";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { resetPassword } from "@/actions/auth/action";
import { useLogInUserStore } from "@/store/logInUserStore";
import { resetProfileImageRefresh } from "@/utils/profileImageRefresh";
import logoWithSlogan from "../../assets/logo-with-text.webp";
import logoForDark from "../../assets/logo-with-text-dark.png";
import SecureIcon from "../Icons/PlanIcons/SecureIcon";
import gdpr from "../../assets/gdpr.webp";
import hipaa from "../../assets/hipaa.webp";

const ResetPasswordClient = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const reset_token = searchParams.get("reset_token");

  const form = useForm<z.infer<typeof createNewPasswordSchema>>({
    resolver: zodResolver(createNewPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const { setLogInUserData } = useLogInUserStore();

  async function onSubmit(values: z.infer<typeof createNewPasswordSchema>) {
    setLoading(true);
    try {
      const res = await resetPassword({
        data: {
          reset_token: reset_token!,
          password: values?.confirmPassword,
        },
      });
      if (res?.success) {
        resetProfileImageRefresh();
        setLogInUserData({
          id: res?.data?.id,
          name: res?.data?.name,
          email: res?.data?.email,
          image: res?.data?.image,
          imageSyncedAt: Date.now(),
          role: res?.data?.role,
          phone: res?.data?.phone,
          timezone: res?.data?.time_zone,
          company_id: res?.data?.company_id,
        });
        router.push("/dashboard");
        toast.success(res?.message || "Password reset successfully");
      } else {
        toast.error(res?.message || "Invalid credentials", {
          style: {
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
          },
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Server is not active", {
        style: {
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
        },
      });
    } finally {
      setLoading(false);
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const passwordValue = form.watch("password");

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 lg:p-8">
      {/* Main Container Card */}
      <div className="w-full max-w-[940px] bg-white dark:bg-zinc-900 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col lg:flex-row min-h-[580px]">
        
        {/* Left Column: Reset Password Form */}
        <div className="w-full lg:w-1/2 p-6 lg:p-10 flex flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="mb-6">
              <Image
                src={logoWithSlogan}
                alt="Logo"
                width={140}
                height={40}
                className="hidden dark:block object-contain"
              />
              <Image
                src={logoForDark}
                alt="Logo"
                width={140}
                height={40}
                className="dark:hidden object-contain"
              />
            </div>

            {/* Header */}
            <div className="mb-6">
              <h1 className=" text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                Create your password
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
                Must be at least 8 characters.
              </p>
            </div>

            {/* Form */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* New Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                        Create new password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <SecureIcon
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            size={18}
                          />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10 h-12.5 rounded-xl border-slate-200 bg-white dark:bg-zinc-800 dark:border-zinc-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          >
                            {showPassword ? (
                              <Eye className="h-5 w-5 cursor-pointer" />
                            ) : (
                              <EyeOff className="h-5 w-5 cursor-pointer" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      
                      {/* Password Strength Indicator Bars */}
                      <div className="pt-1.5">
                        <div className="grid grid-cols-4 gap-1.5 mb-1">
                          <div className={`h-1 rounded-full transition-colors ${passwordValue.length > 0 ? "bg-gradient-to-r from-[#0160F1] to-[#7B61FF]" : "bg-slate-200 dark:bg-zinc-700"}`} />
                          <div className={`h-1 rounded-full transition-colors ${passwordValue.length >= 6 ? "bg-gradient-to-r from-[#0160F1] to-[#7B61FF]" : "bg-slate-200 dark:bg-zinc-700"}`} />
                          <div className={`h-1 rounded-full transition-colors ${passwordValue.length >= 8 ? "bg-gradient-to-r from-[#0160F1] to-[#7B61FF]" : "bg-slate-200 dark:bg-zinc-700"}`} />
                          <div className={`h-1 rounded-full transition-colors ${passwordValue.length >= 10 ? "bg-gradient-to-r from-[#0160F1] to-[#7B61FF]" : "bg-slate-200 dark:bg-zinc-700"}`} />
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Strength</span>
                          <span className={`font-semibold ${passwordValue.length >= 8 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                            {passwordValue.length >= 8 ? "Strong" : "Weak"}
                          </span>
                        </div>
                      </div>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Confirm Password Field */}
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                        Confirm your password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <SecureIcon
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            size={18}
                          />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="confirm password"
                            className="pl-10 pr-10 h-12.5 rounded-xl border-slate-200 bg-white dark:bg-zinc-800 dark:border-zinc-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                          >
                            {showPassword ? (
                              <Eye className="h-5 w-5 cursor-pointer" />
                            ) : (
                              <EyeOff className="h-5 w-5 cursor-pointer" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <button
                  disabled={loading}
                  type="submit"
                  className="mt-6 w-full h-12.5 cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-gradient-to-r from-[#0160F1] to-[#7B61FF] text-white font-medium rounded-full shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    "Loading..."
                  ) : (
                    <>
                      Set New password <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </Form>
          </div>

        </div>

        {/* Right Column: Hero Banner Steps Guide (Step 3 Active) */}
        <div className="lg:w-1/2 m-2 bg-gradient-to-br from-[#0160F1] via-[#4c60fa] to-[#7B61FF] p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden rounded-[20px] lg:rounded-[24px]">
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-25 overflow-hidden"
            viewBox="0 0 400 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="450" cy="80" r="150" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <circle cx="450" cy="80" r="250" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <circle cx="450" cy="80" r="350" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>

          {/* Step Indicator Header */}
          <div className="relative z-10 text-xs font-semibold tracking-wider uppercase text-blue-100">
            Step 3 / 3
          </div>

          {/* Main Hero Title */}
          <div className="relative z-10 my-4">
            <h2 className="text-2xl md:text-3xl font-bold mb-2 leading-tight text-balance">
              Reset your password in three quick steps
            </h2>
          </div>

          {/* Steps List */}
          <div className="relative z-10 space-y-5 my-auto">
            {/* Each step but the last draws its own segment, from the bottom of its
                bubble to the top of the next one (`-bottom-5` matches `space-y-5`). One
                line for the whole list overshot the last bubble whenever the
                descriptions wrapped, which they do on phones. */}

            {/* Step 1 (Done) */}
            <div className="relative flex items-start gap-4">
              <div aria-hidden="true" className="absolute left-4 top-8 -bottom-5 w-[1.5px] -translate-x-1/2 bg-[#FFFFFFD9]" />
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white/25 text-white font-bold flex items-center justify-center text-sm backdrop-blur-sm border border-[#FFFFFFD9]">
                <Check className="h-4 w-4 stroke-[3]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-white">Email</h3>
                  <div className="py-0.5 px-2 rounded-full text-xs bg-[#4f83f6] font-medium">Done</div>
                </div>
                <p className="text-sm text-blue-100 mt-0.5 leading-relaxed">
                  We’ll send a 6 digit code to the email linked to your account.
                </p>
              </div>
            </div>

            {/* Step 2 (Done) */}
            <div className="relative flex items-start gap-4">
              <div aria-hidden="true" className="absolute left-4 top-8 -bottom-5 w-[1.5px] -translate-x-1/2 bg-[#FFFFFFD9]" />
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white/25 text-white font-bold flex items-center justify-center text-sm backdrop-blur-sm border border-[#FFFFFFD9]">
                <Check className="h-4 w-4 stroke-[3]" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-white">Verify</h3>
                  <div className="py-0.5 px-2 rounded-full text-xs bg-[#4f83f6] font-medium">Done</div>
                </div>
                <p className="text-sm text-blue-100 mt-0.5 leading-relaxed">
                  Enter the 6 digit code from your inbox. It can take up to a minute to arrive.
                </p>
              </div>
            </div>

            {/* Step 3 (Active) */}
            <div className="relative flex items-start gap-4">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white text-blue-600 font-bold flex items-center justify-center text-sm shadow-md">
                3
              </div>
              <div>
                <h3 className="font-semibold text-white/90">New password</h3>
                <p className="text-sm text-blue-100/80 mt-0.5 leading-relaxed">
                  Choose a password with at least 8 characters, then go straight to your dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-4 pt-2 text-xs text-blue-100/60">
            Staff Time Tracker Secure Recovery
          </div>
        </div>
      </div>

      {/* Bottom Trust & Compliance Bar */}
      <div className="w-full max-w-[740px] bg-white dark:bg-zinc-800 rounded-3xl md:rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-zinc-700 px-6 py-3 mt-6 flex flex-wrap gap-4 items-center justify-between">
        {/* Rating Section */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center text-amber-400 gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-white">
            4.9 out of 5
          </span>
        </div>

        <div className="hidden md:block h-5 w-[1px] bg-slate-200 dark:bg-zinc-700" />

        {/* SOC 2 Badge */}
        <div className="flex items-center gap-2 border border-emerald-200/60 dark:border-emerald-800 px-3.5 py-1.5 rounded-full">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold">SOC 2 Type II</span>
        </div>

        {/* Compliance Badges */}
        <div className="flex items-center gap-3">
          <Image src={gdpr} alt="gdpr" width={30} height={30} />
          <Image src={hipaa} alt="hipaa" width={30} height={30} />
        </div>

        <div className="hidden md:block h-5 w-[1px] bg-slate-200 dark:bg-zinc-700" />

        {/* Encrypted HTTPS */}
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs font-medium">
          <SecureIcon size={16} className="h-3.5 w-3.5 text-slate-600" />
          <span>Secured with encrypted HTTPS</span>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordClient;