/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { loginSchema } from "@/zod/schema";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { useForm } from "react-hook-form";
import Image from "next/image";
import { useCallback, useState, useEffect } from "react";
import { Eye, EyeOff, ArrowRight, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { logIn } from "@/actions/auth/action";
import { actionErrorMessage } from "@/lib/actionErrors";
import { beginClientSession, resetClientSession } from "@/lib/clientSession";
import logoWithSlogan from "../../assets/logo-with-text.webp";
import logoForDark from "../../assets/logo-with-text-dark.png";
import { requiresOrganizationOnboarding } from "@/lib/authSession";
import { MARKETING_SIGN_UP_URL, MARKETING_SITE_URL } from "@/lib/siteLinks";
import {
  buildCreateOrganizationUrl,
  EMPTY_MARKETING_PLAN_INTENT,
} from "@/lib/marketingPlanIntent";
import EmailIcon from "../Icons/EmailIcon";
import SecureIcon from "../Icons/PlanIcons/SecureIcon";
import gdpr from "../../assets/gdpr.webp";
import hipaa from "../../assets/hipaa.webp";

// Carousel items for the right-hand showcase banner
const SLIDES = [
  {
    title: "Manage Time Better, Work Smarter Together",
    description:
      "Take control of your team’s time, productivity, and daily activities with accurate tracking and effortless management from one simple, organized platform.",
  },
  {
    title: "Track Projects & Tasks in Real Time",
    description:
      "Keep projects on schedule with automated activity logging, insightful reports, and smooth collaboration across all your team members.",
  },
  {
    title: "Streamline Team Payroll & Productivity",
    description:
      "Generate detailed time sheets and accurate work summaries in minutes so your organization can focus on scaling efficiently.",
  },
];

const LoginClientComponent = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  // Auto-rotate hero slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email,
      password: "",
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const enterDashboard = useCallback(
    (data: any) => {
      beginClientSession(data);
      router.push("/dashboard");
    },
    [router],
  );

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setLoading(true);
    try {
      const res: any = await logIn(values);

      // Verified email, no organization yet: finish onboarding on its own
      // page, the same screen the signup funnel lands on. `CreateOrganizationDialog`
      // is a full-page layout now, not a modal, so rendering it here stacked a
      // second card under this one, below the fold.
      if (requiresOrganizationOnboarding(res)) {
        // `logIn` cleared the session cookies for this answer; whatever an
        // earlier session left in this browser goes with them.
        resetClientSession();
        router.push(
          buildCreateOrganizationUrl(
            res.data.email || values.email,
            res.data.name,
            EMPTY_MARKETING_PLAN_INTENT,
          ),
        );
        return;
      }

      if (res?.success) {
        toast.success(res?.message || "Login successful");
        enterDashboard(res?.data ?? {});
      } else {
        toast.error(res?.message || "Invalid credentials", {
          style: {
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
          },
        });
      }
    } catch (error) {
      toast.error(actionErrorMessage(error, "Server is not active"), {
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
        {/* Left Column: Login Form */}
        <div className="w-full lg:w-1/2 p-6 lg:p-10 flex flex-col justify-between">
          <div>
            {/* Logo — back to the marketing site. A plain <a>: it leaves the
                app, so there is nothing for next/link to prefetch. */}
            <div className="mb-8">
              <a
                href={MARKETING_SITE_URL}
                aria-label="Staff Time Tracker home"
                className="inline-block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
              >
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
              </a>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                Sign in
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1.5">
                Enter your details to sign in
              </p>
            </div>

            {/* Form */}
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                {/* Email Field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className=" font-semibold text-slate-700 dark:text-slate-300">
                        Email
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          {/* <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" /> */}
                          <EmailIcon
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            size={16}
                          />
                          <Input
                            type="email"
                            placeholder="Email"
                            className="pl-10 h-12.5 rounded-xl border-slate-200 bg-white dark:bg-zinc-800 dark:border-zinc-700 text-slate-900 dark:text-white placeholder:text-slate-400 "
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password Field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <FormLabel className=" font-semibold text-slate-700 dark:text-slate-300">
                          Password
                        </FormLabel>
                        <Link href="/auth/forgot-password">
                          <span className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors">
                            Forgot Password?
                          </span>
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <SecureIcon
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                            size={18}
                          />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            className="pl-10 pr-10 h-12.5 rounded-xl border-slate-200 bg-white dark:bg-zinc-800 dark:border-zinc-700 text-slate-900 dark:text-white placeholder:text-slate-400 "
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
                  className="mt-8 w-full h-12.5 cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-gradient-to-r from-[#0160F1] to-[#7B61FF] text-white font-medium rounded-full shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    "Loading..."
                  ) : (
                    <>
                      Sign in <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </Form>
          </div>

          {/* Footer Callout */}
          <div className="mt-8 pt-4  text-slate-500 dark:text-slate-400">
            New to Staff Time Tracker?{" "}
            <a
              href={MARKETING_SIGN_UP_URL}
              className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              Try for Free
            </a>
          </div>
        </div>

        {/* Right Column: Hero Banner Carousel */}
        {/* `m-2` at every width insets the panel inside the white card (it used
            to bleed to the edges below `lg:`). No `w-full`: in the stacked
            column it stretches, and 100% + margin would overflow. */}
        <div className="lg:w-1/2 m-2 bg-gradient-to-br from-[#0160F1] via-[#4c60fa] to-[#7B61FF] p-6 sm:p-8 lg:p-10 text-white flex flex-col gap-5 justify-between relative overflow-hidden rounded-[20px] lg:rounded-[24px]">
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

          {/* Slide Indicator Number */}
          <div className="relative z-10 text-sm font-medium text-white">
            0{currentSlide + 1}{" "}
            <span className="opacity-60">/ 0{SLIDES.length}</span>
          </div>

          {/* Floating Time Tracker Visual Mockup */}
          <div className="w-full max-w-68 lg:max-w-none lg:w-[70%] relative z-10">
            <div className="w-full max-w-sm bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center gap-2 mb-3  font-medium text-blue-100">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Tracking now
              </div>
              <div className="text-4xl font-extrabold text-white mb-6">
                07:42:18
              </div>

              {/* Animated Activity Bars */}
              <div className="flex items-end gap-2 h-20 pt-2">
                <div className="flex-1 bg-white/30 rounded-md h-[40%]" />
                <div className="flex-1 bg-white/40 rounded-md h-[60%]" />
                <div className="flex-1 bg-white/50 rounded-md h-[80%]" />
                <div className="flex-1 bg-white/40 rounded-md h-[55%]" />
                <div className="flex-1 bg-white rounded-md h-[100%] shadow-lg" />
                <div className="flex-1 bg-white/30 rounded-md h-[35%]" />
              </div>
            </div>
          </div>

          {/* Text Content Carousel & Dots */}
          <div className="relative z-10">
            {/* Every slide is rendered into the same grid cell so the block is
                always as tall as the longest slide. Swapping the text alone
                changed the panel's height every 6s, which on the stacked
                mobile layout shoved the trust bar below up and down. */}
            <div className="grid mb-6">
              {SLIDES.map((slide, index) => (
                <div
                  key={slide.title}
                  aria-hidden={currentSlide !== index}
                  className={`col-start-1 row-start-1 transition-opacity duration-500 ${
                    currentSlide === index ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-medium mb-3 text-balance">
                    {slide.title}
                  </h2>
                  <p className="text-sm sm:text-base text-darkTextPrimary leading-relaxed max-w-md">
                    {slide.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Pagination Dots */}
            <div className="flex items-center gap-2">
              {SLIDES.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    currentSlide === index
                      ? "w-8 bg-white"
                      : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

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
          <span className="text-xs font-semibold ">SOC 2 Type II</span>
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

export default LoginClientComponent;
