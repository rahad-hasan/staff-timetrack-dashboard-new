/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signUpSchema } from "@/zod/schema";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Star,
  User,
} from "lucide-react";
import logoWithSlogan from "@/assets/logo-with-text.webp";
import logoForDark from "@/assets/logo-with-text-dark.png";
import SecureIcon from "@/components/Icons/PlanIcons/SecureIcon";
import gdpr from "@/assets/gdpr.webp";
import hipaa from "@/assets/hipaa.webp";
import OnboardingBackdrop from "@/components/auth/CreateOrganization/OnboardingBackdrop";

interface SignUpProps {
  onSubmit?: (data: { name: string; email: string; password: string }) => Promise<void>;
}

const SignUp = ({ onSubmit }: SignUpProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  const form = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const passwordValue = form.watch("password");
  const passwordStrengthChecks = [
    passwordValue.length >= 8,
    /[A-Z]/.test(passwordValue),
    /[0-9]/.test(passwordValue),
    /[^A-Za-z0-9]/.test(passwordValue),
  ];
  const passwordStrength = passwordStrengthChecks.filter(Boolean).length;
  const passwordStrengthLabel =
    passwordStrength <= 1
      ? "Weak"
      : passwordStrength === 2
        ? "Fair"
        : passwordStrength === 3
          ? "Good"
          : "Strong";
  const passwordStrengthHint =
    passwordStrength === 4
      ? "great password!"
      : passwordStrength === 3 && !passwordStrengthChecks[3]
        ? "add a symbol to make it strong"
        : passwordStrength === 3 && !passwordStrengthChecks[0]
          ? "use at least 8 characters to make it strong"
          : passwordStrength === 3 && !passwordStrengthChecks[1]
            ? "add an uppercase letter to make it strong"
            : passwordStrength === 3
              ? "add a number to make it strong"
              : passwordValue.length < 8
                ? "use at least 8 characters"
                : "add uppercase letters, numbers & symbols";

  const handleSubmit = async (values: z.infer<typeof signUpSchema>) => {
    if (!agreeTerms) {
      toast.error("Please agree to the Terms, Privacy Policy, and DPA to continue.");
      return;
    }

    setLoading(true);
    try {
      if (onSubmit) {
        await onSubmit(values);
      } else {
        // Default navigation demo behavior
        toast.success("Account created successfully!");
        router.push(`/auth/verify-otp?email=${encodeURIComponent(values.email)}`);
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 lg:p-8">
      <OnboardingBackdrop/>
      {/* Main Container Card */}
      <div className="w-full max-w-[940px] bg-white dark:bg-zinc-900 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col lg:flex-row min-h-[620px] overflow-hidden">
        
        {/* Left Column: Create Account Form */}
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
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                Create your account
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
                Free for 14 days. No credit card required.
              </p>
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              {/* Full Name Input */}
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">Full Name</FormLabel>
                  <FormControl><div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input placeholder="Full Name" className="h-12.5 rounded-xl border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" {...field} />
                  </div></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Work Email Input */}
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">Work email</FormLabel>
                  <FormControl><div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input type="email" placeholder="name@company.com" className="h-12.5 rounded-xl border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" {...field} />
                  </div></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Password Input */}
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input type={showPassword ? "text" : "password"} placeholder="Password" className="h-12.5 rounded-xl border-slate-200 bg-white pl-10 pr-10 text-slate-900 placeholder:text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white" {...field} />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />

                <div className="pt-1.5">
                  <div className="mb-1 grid grid-cols-4 gap-1.5">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`h-1 rounded-full transition-colors ${
                          passwordStrength >= bar
                            ? "bg-gradient-to-r from-[#0160F1] to-[#7B61FF]"
                            : "bg-slate-200 dark:bg-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                  <p className="mt-1 text-xs text-slate-600">
                    <span className="w-0.5 h-0.5 rounded-full bg-slate-600"></span> {passwordStrengthHint}
                  </p>
                    <span
                      className={`font-semibold ${passwordStrength >= 4 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}
                    >
                      {passwordStrengthLabel}
                    </span>
                  </div>

                </div>
                </FormItem>
              )} />

              {/* Checkbox Terms Agreement */}
              <div className="pt-1 flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label
                  htmlFor="agreeTerms"
                  className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none"
                >
                  I agree to the{" "}
                  <Link href="/terms" className="text-blue-600 hover:underline dark:text-blue-400 font-medium">
                    Terms
                  </Link>
                  ,{" "}
                  <Link href="/privacy" className="text-blue-600 hover:underline dark:text-blue-400 font-medium">
                    Privacy policy
                  </Link>{" "}
                  and{" "}
                  <Link href="/dpa" className="text-blue-600 hover:underline dark:text-blue-400 font-medium">
                    DPA
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full h-12.5 cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-gradient-to-r from-[#0160F1] to-[#7B61FF] text-white font-medium rounded-full shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  "Creating account..."
                ) : (
                  <>
                    Create my account <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
              </form>
            </Form>
          </div>

          {/* Footer Sign-in Link */}
          <div className="mt-8 pt-4 text-slate-500 dark:text-slate-400 text-sm">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Right Column: Hero Banner & 4-Step Progress Track (Step 1 Active) */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-[#0160F1] via-[#4c60fa] to-[#7B61FF] p-6 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden lg:m-2 rounded-[24px]">
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

          {/* Top Header Tag & Title */}
          <div>
            <div className="relative z-10 text-xs font-semibold tracking-wider uppercase text-blue-100 mb-2">
              STEP 1 / 4
            </div>
            <h2 className="relative z-10 text-2xl md:text-3xl font-bold mb-6 leading-tight">
              Start free in four quick steps
            </h2>

            {/* Testimonial Card (Priya Nair) */}
            <div className="relative z-10 bg-white/10 backdrop-blur-[2px] border border-white/20 rounded-2xl p-5 mb-8">
              <div className="flex items-center text-amber-300 gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <blockquote className="text-sm text-blue-50 font-normal leading-relaxed mb-4">
                &ldquo;Onboarding took a single afternoon. Our remote teams
                finally have one place to log hours and see where the time
                goes.&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/25 border border-white/40 flex items-center justify-center font-bold text-xs">
                  PN
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">
                    Priya Nair
                  </div>
                  <div className="text-[11px] text-blue-100/80">
                    People Lead · IT Consulting, 300+
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step Track */}
          <div className="relative z-10 space-y-6 my-auto">
            {/* Vertical Connector Line */}
            <div className="absolute left-4 top-4 bottom-1 w-[1.5px] bg-white/30" />

            {/* Step 1: Account (Active) */}
            <div className="relative flex items-start gap-3.5">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white text-blue-600 font-bold flex items-center justify-center text-sm shadow-md">
                1
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">Account</h3>
                <p className="text-sm text-blue-100 mt-0.5 leading-relaxed font-light">
                  Name, work email and a password.
                </p>
              </div>
            </div>

            {/* Step 2: Verify email */}
            <div className="relative flex items-start gap-3.5">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white/20 text-white/80 font-bold flex items-center justify-center text-sm backdrop-blur-sm border border-white/20">
                2
              </div>
              <div>
                <h3 className="font-semibold text-white/90 text-base">
                  Verify email
                </h3>
                <p className="text-sm text-blue-100/70 mt-0.5 leading-relaxed font-light">
                  Enter the 6 digit code we send to your inbox.
                </p>
              </div>
            </div>

            {/* Step 3: Organization */}
            <div className="relative flex items-start gap-3.5">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white/20 text-white/80 font-bold flex items-center justify-center text-sm backdrop-blur-sm border border-white/20">
                3
              </div>
              <div>
                <h3 className="font-semibold text-white/90 text-base">
                  Organization
                </h3>
                <p className="text-sm text-blue-100/70 mt-0.5 leading-relaxed font-light">
                  Name, phone, time zone and address.
                </p>
              </div>
            </div>

            {/* Step 4: Workspace */}
            <div className="relative flex items-start gap-3.5">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white/20 text-white/80 font-bold flex items-center justify-center text-sm backdrop-blur-sm border border-white/20">
                4
              </div>
              <div>
                <h3 className="font-semibold text-white/90 text-base">
                  Workspace
                </h3>
                <p className="text-sm text-blue-100/70 mt-0.5 leading-relaxed font-light">
                  Week start, weekend, idle limit and currency.
                </p>
              </div>
            </div>
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

export default SignUp;
