"use client";

import { Check, ArrowRight, ShieldCheck, Star } from "lucide-react";
import Image from "next/image";
import logoWithSlogan from "@/assets/logo-with-text.webp";
import logoForDark from "@/assets/logo-with-text-dark.png";
import gdpr from "../../../assets/gdpr.webp";
import hipaa from "../../../assets/hipaa.webp";
import SecureIcon from "@/components/Icons/PlanIcons/SecureIcon";
import OnboardingBackdrop from "@/components/auth/CreateOrganization/OnboardingBackdrop";

interface OnboardingSuccessClientProps {
  userName?: string;
  organizationName?: string;
  onEnterDashboard: () => void;
}

const OnboardingSuccessClient = ({
  userName = "Sarah",
  organizationName = "Northwind",
  onEnterDashboard,
}: OnboardingSuccessClientProps) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 lg:p-8 overflow-y-auto">
      <OnboardingBackdrop />
      {/* Main Container Card matching the design system style */}
      <div className="w-full max-w-[940px] bg-white dark:bg-zinc-900 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col lg:flex-row min-h-[620px] overflow-hidden">
        {/* Left Column: Summary & Next Actions */}
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
            <div className="mb-4">
              <div className="flex flex-col gap-2 mb-2">
                <div className="w-14 h-14 rounded-full bg-[#e8f7ef] dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Check className="h-6 w-6" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  You’re all set, {userName}
                </h1>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 ">
                {organizationName} is ready. We’ve loaded sample data so you can
                explore before your team joins.
              </p>
            </div>

            {/* Summary Review Items Card List */}
            <div className="space-y-3 bg-[#f0f4f9] dark:bg-zinc-800/50 p-4 rounded-2xl border border-slate-100 dark:border-zinc-800 mb-6">
              {/* Item 1 */}
              <div className="flex items-start gap-3 pb-3 border-b border-[#DDE2EA] dark:border-zinc-700/60">
                <div className=" w-5 h-5 rounded-full bg-[#16a36a] text-white flex items-center justify-center mt-0.5">
                  <Check className="h-3 w-3" />
                </div>
                <div className="">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Account created
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Sarah Johnson
                  </div>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex items-start gap-3 pb-3 border-b border-[#DDE2EA] dark:border-zinc-700/60">
                <div className=" w-5 h-5 rounded-full bg-[#16a36a] text-white flex items-center justify-center mt-0.5">
                  <Check className="h-3 w-3" />
                </div>
                <div className="">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Email verified
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    sarah@northwind.co
                  </div>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex items-start gap-3 pb-3 border-b border-[#DDE2EA] dark:border-zinc-700/60">
                <div className=" w-5 h-5 rounded-full bg-[#16a36a] text-white flex items-center justify-center mt-0.5">
                  <Check className="h-3 w-3" />
                </div>
                <div className="">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Organization
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Northwind · London (GMT+1)
                  </div>
                </div>
              </div>

              {/* Item 4 */}
              <div className="flex items-start gap-3">
                <div className=" w-5 h-5 rounded-full bg-[#16a36a] text-white flex items-center justify-center mt-0.5">
                  <Check className="h-3 w-3" />
                </div>
                <div className="">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    Workspace defaults
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Mon start · 2-day weekend · GBP
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={onEnterDashboard}
              className="w-full h-12.5 cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-gradient-to-r from-[#0160F1] to-[#7B61FF] text-white font-medium rounded-full shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              Go to my dashboard <ArrowRight className="size-4" />
            </button>
          </div>

          {/* Subtext Footer Info */}
          <div className="mt-5 text-sm text-slate-500 dark:text-slate-400">
            Next:{" "}
            <span className="text-[#0160F1] dark:text-slate-300 font-medium">
              Download the desktop app to start tracking
            </span>
          </div>
        </div>

        {/* Right Column: Hero Banner with Trial Card and Full 4-Step Progress Track */}
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

          {/* Header Tag */}
          <div>
            <div className="relative z-10 text-xs font-semibold tracking-wider uppercase text-blue-100 mb-3">
              ALL DONE
            </div>
            <h2 className="relative z-10 text-2xl font-semibold mb-6">
              Your free trial starts now
            </h2>

            {/* Trial Info Card */}
            <div className="relative z-10 bg-white/10 backdrop-blur-[1px] border border-white/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-4 text-xs font-medium text-white/90">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Free trial – 14 days left
              </div>
              <div className="text-2xl text-white">
                Ends Nov 11, 2026
              </div>
              {/* Progress bar line */}
              <div className="w-full bg-[#628ff7] h-1.5 my-4 rounded-full overflow-hidden">
                <div className="bg-white h-full w-[5%]" />
              </div>
              <p className="text-sm font-thin text-blue-100">
                Every feature unlocked. Choose a plan any time – no card until
                you do.
              </p>
            </div>
          </div>

          {/* 4-Step Completed Progress List with Connectors */}
          <div className="relative z-10 space-y-8 my-6">
            {/* Vertical Connector Line */}
            <div className="absolute left-4 top-3 bottom-0 w-[1.5px] bg-[#FFFFFFD9]" />

            {/* Step 1: Account (Done) */}
            <div className="relative flex items-start gap-3">
              <div className="relative z-10  w-8 h-8 rounded-full bg-white/25 text-white font-bold flex items-center justify-center text-base backdrop-blur-sm border border-[#FFFFFFD9]">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white text-base font-semibold">Account</h3>
                  <span className="py-0.5 px-2 rounded-full text-xs bg-white/20 font-medium">
                    Done
                  </span>
                </div>
                <p className="text-sm text-blue-100 font-thin ">
                  Name, work email and a password.
                </p>
              </div>
            </div>

            {/* Step 2: Verify email (Done) */}
            <div className="relative flex items-start gap-3">
              <div className="relative z-10  w-8 h-8 rounded-full bg-white/25 text-white font-bold flex items-center justify-center backdrop-blur-sm border border-[#FFFFFFD9]">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white text-base font-semibold">
                    Verify email
                  </h3>
                  <span className="py-0.5 px-2 rounded-full text-xs bg-white/20 font-medium">
                    Done
                  </span>
                </div>
                <p className="text-sm text-blue-100 font-thin ">
                  Enter the 6 digit code we send to your inbox.
                </p>
              </div>
            </div>

            {/* Step 3: Organization (Done) */}
            <div className="relative flex items-start gap-3">
              <div className="relative z-10  w-8 h-8 rounded-full bg-white/25 text-white font-bold flex items-center justify-center backdrop-blur-sm border border-[#FFFFFFD9]">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white text-base font-semibold">
                    Organization
                  </h3>
                  <span className="py-0.5 px-2 rounded-full text-xs bg-white/20 font-medium">
                    Done
                  </span>
                </div>
                <p className="text-sm text-blue-100 font-thin ">
                  Name, phone, time zone and address.
                </p>
              </div>
            </div>

            {/* Step 4: Workspace (Done) */}
            <div className="relative flex items-start gap-3">
              <div className="relative z-10  w-8 h-8 rounded-full bg-white/25 text-white font-bold flex items-center justify-center backdrop-blur-sm border border-[#FFFFFFD9]">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-white text-base font-semibold">
                    Workspace
                  </h3>
                  <span className="py-0.5 px-2 rounded-full text-xs bg-white/20 font-medium">
                    Done
                  </span>
                </div>
                <p className="text-sm text-blue-100 font-thin ">
                  Week start, weekend, idle limit and currency.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Trust & Compliance Bar */}
      <div className="w-full max-w-[740px] bg-white dark:bg-zinc-800 rounded-3xl md:rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-zinc-700 px-6 py-3 mt-6 flex flex-wrap gap-4 items-center justify-between">
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

        <div className="flex items-center gap-2 border border-emerald-200/60 dark:border-emerald-800 px-3.5 py-1.5 rounded-full">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold">SOC 2 Type II</span>
        </div>

        <div className="flex items-center gap-3">
          <Image src={gdpr} alt="gdpr" width={30} height={30} />
          <Image src={hipaa} alt="hipaa" width={30} height={30} />
        </div>

        <div className="hidden md:block h-5 w-[1px] bg-slate-200 dark:bg-zinc-700" />

        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs font-medium">
          <SecureIcon size={16} className="h-3.5 w-3.5 text-slate-600" />
          <span>Secured with encrypted HTTPS</span>
        </div>
      </div>
    </div>
  );
};

export default OnboardingSuccessClient;
