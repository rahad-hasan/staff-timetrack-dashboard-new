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
import { forgetPasswordSchema } from "@/zod/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useForm } from "react-hook-form";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { forgetPassword } from "@/actions/auth/action";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck, Star } from "lucide-react";
import logoWithSlogan from "@/assets/logo-with-text.webp";
import logoForDark from "@/assets/logo-with-text-dark.png";
import EmailIcon from "../Icons/EmailIcon";
import SecureIcon from "../Icons/PlanIcons/SecureIcon";
import gdpr from "../../assets/gdpr.webp";
import hipaa from "../../assets/hipaa.webp";

const ForgotPasswordClient = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof forgetPasswordSchema>>({
    resolver: zodResolver(forgetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof forgetPasswordSchema>) {
    setLoading(true);
    try {
      const res = await forgetPassword({ data: values });
      if (res?.success) {
        toast.success(res?.message || "OTP sent to your email");
        router.push(`/auth/${res?.data?.redirect}?email=${values.email}`);
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

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 lg:p-8">
      {/* Main Container Card */}
      <div className="w-full max-w-[940px] bg-white dark:bg-zinc-900 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col lg:flex-row min-h-[580px]">
        {/* Left Column: Forgot Password Form */}
        <div className="w-full lg:w-1/2 p-6 lg:p-12 flex flex-col justify-between">
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

            {/* Back to sign in */}
            <div className="mb-6">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Forgot password
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1.5">
                Please enter your Email address
              </p>
            </div>

            {/* Form */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                        Email
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <EmailIcon
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            size={16}
                          />
                          <Input
                            type="email"
                            placeholder="Email"
                            className="pl-10 h-12.5 rounded-xl border-slate-200 bg-white dark:bg-zinc-800 dark:border-zinc-700 text-slate-900 dark:text-white placeholder:text-slate-400"
                            {...field}
                          />
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
                  className="mt-8 w-full h-12.5 cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-gradient-to-r from-[#0160F1] to-[#7B61FF] text-white font-medium rounded-full shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    "Loading..."
                  ) : (
                    <>
                      Send Code <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </Form>
          </div>

          {/* Footer Callout */}
          <div className="mt-8 pt-4 text-slate-500 dark:text-slate-400">
            New to Staff Time Tracker?{" "}
            <Link
              href="/auth/register"
              className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Try for Free
            </Link>
          </div>
        </div>

        {/* Right Column: Hero Banner Steps Guide */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-[#0160F1] via-[#4c60fa] to-[#7B61FF] p-6 lg:p-12 text-white flex flex-col justify-between relative overflow-hidden lg:m-2 rounded-[24px]">
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-25 overflow-hidden"
            viewBox="0 0 400 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="450"
              cy="80"
              r="150"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <circle
              cx="450"
              cy="80"
              r="250"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
            />
            <circle
              cx="450"
              cy="80"
              r="350"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>

          {/* Step Indicator Header */}
          <div className="relative z-10 text-xs font-semibold tracking-wider uppercase text-blue-100">
            Step 1 / 3
          </div>

          {/* Main Hero Title & Description */}
          <div className="relative z-10 my-6">
            <h2 className="text-3xl font-bold mb-3 leading-tight">
              Reset your password in three quick steps
            </h2>
          </div>

          {/* Steps List */}
          <div className="relative z-10 space-y-5 my-auto">
            {/* Vertical Connector Line */}
            <div className="absolute left-4 top-4 bottom-12 sm:bottom-6 w-[1.5px] bg-white/40" />

            {/* Step 1 */}
            <div className="relative flex items-start gap-4">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white text-blue-600 font-bold flex items-center justify-center text-sm shadow-md">
                1
              </div>
              <div>
                <h3 className="font-semibold text-white">Email</h3>
                <p className="text-sm text-blue-100 mt-0.5 leading-relaxed">
                  We’ll send a 6 digit code to the email linked to your account.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex items-start gap-4">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white/25 text-white font-bold flex items-center justify-center text-sm backdrop-blur-sm border border-white/30">
                2
              </div>
              <div>
                <h3 className="font-semibold text-white/90">Verify</h3>
                <p className="text-sm text-blue-100/80 mt-0.5 leading-relaxed">
                  Enter the 6 digit code from your inbox. It can take up to a
                  minute to arrive.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex items-start gap-4">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white/25 text-white font-bold flex items-center justify-center text-sm backdrop-blur-sm border border-white/30">
                3
              </div>
              <div>
                <h3 className="font-semibold text-white/90">New password</h3>
                <p className="text-sm text-blue-100/80 mt-0.5 leading-relaxed">
                  Choose a password with at least 8 characters, then go straight
                  to your dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-6 pt-4 text-xs text-blue-100/60">
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

export default ForgotPasswordClient;
