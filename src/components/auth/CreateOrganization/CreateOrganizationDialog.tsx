"use client";

import { ArrowLeft, ArrowRight, Check, Loader2, ShieldCheck, Star } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ICreateOrganizationResponse } from "@/types/type";
import OrganizationProfileStep from "./OrganizationProfileStep";
import WorkspacePreferencesStep from "./WorkspacePreferencesStep";
import { useCreateOrganizationForm } from "./useCreateOrganizationForm";
import logoWithSlogan from "@/assets/logo-with-text.webp";
import logoForDark from "@/assets/logo-with-text-dark.png";
import gdpr from "../../../assets/gdpr.webp";
import hipaa from "../../../assets/hipaa.webp";
import SecureIcon from "@/components/Icons/PlanIcons/SecureIcon";

interface CreateOrganizationDialogProps {
  open: boolean;
  /** From the sign-in response — submitted with the form, never shown as input. */
  email: string;
  /**
   * The signed-up person's name, when the entry point had one to pass. Only
   * seeds the step-1 name suggestions, so every caller may omit it.
   */
  userName?: string;
  onOpenChange: (open: boolean) => void;
  onCompleted: (organization: ICreateOrganizationResponse) => void;
}

const CreateOrganizationDialog = ({
  open,
  email,
  userName,
  onOpenChange,
  onCompleted,
}: CreateOrganizationDialogProps) => {
  const {
    form,
    step,
    stepIndex,
    isFirstStep,
    isLastStep,
    submitting,
    goBack,
    setOrgName,
    suggestions,
    handleSubmit,
  } = useCreateOrganizationForm({ email, userName, onCompleted });

  if (!open) return null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 lg:p-8">
      {/* Main Container Card matching the design system style */}
      <div className="w-full max-w-[940px] bg-white dark:bg-zinc-900 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col lg:flex-row mb-5 overflow-hidden">

        {/* Left Column: Form Content */}
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
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                {stepIndex === 0 ? "Your organization" : "Workspace defaults"}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                {stepIndex === 0
                  ? "Your team and your invoices will be identified by this."
                  : "How the week is counted, when a session goes idle and what you bill in."}
              </p>
            </div>

            {/* Form Steps */}
            <Form {...form}>
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {step.id === "profile" && (
                  <OrganizationProfileStep
                    control={form.control}
                    suggestions={suggestions}
                    onPickSuggestion={setOrgName}
                    disabled={submitting}
                    email={email}
                  />
                )}
                {step.id === "workspace" && (
                  <WorkspacePreferencesStep
                    control={form.control}
                    disabled={submitting}
                  />
                )}

                {/* Actions / Buttons Footer */}
                <div className="flex items-center gap-3">
                  {!isFirstStep && (
                    <Button
                      type="button"
                      variant="outline2"
                      onClick={goBack}
                      disabled={submitting}
                      className="h-12.5 px-8 rounded-full border-slate-200 dark:border-zinc-700 font-medium"
                    >
                      {/* <ArrowLeft className="size-4 mr-1.5" /> */}
                      Back
                    </Button>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-12.5 cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-gradient-to-r from-[#0160F1] to-[#7B61FF] text-white font-medium rounded-full shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    {isLastStep
                      ? submitting
                        ? "Creating..."
                        : "Create organization"
                      : "Continue"}
                    {!isLastStep && <ArrowRight className="size-4" />}
                  </button>
                </div>
              </form>
            </Form>
          </div>

          {/* Bottom Back to sign-in option for step 1 */}
          {isFirstStep && (
            <div className="mt-5 text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="inline-flex items-center cursor-pointer gap-1.5 font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Hero Banner with Testimonial and 4-Step Progress Tracker */}
        <div className="w-full lg:w-1/2 bg-gradient-to-br from-[#0160F1] via-[#4c60fa] to-[#7B61FF] p-6 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden lg:m-2 rounded-[24px]">
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

          {/* Step Header */}
          <div className="relative z-10 text-xs font-semibold tracking-wider uppercase text-blue-100">
            STEP {stepIndex + 3} / 4
          </div>

          <div className="relative z-10 my-3">
            <h2 className="text-2xl mb-1 ">
              Set up your organization
            </h2>
          </div>

          {/* Testimonial Card */}
          <div className="relative z-10 bg-white/10 backdrop-blur-[1px] border border-white/20 rounded-2xl p-5 my-4 shadow-xl">
            <div className="flex items-center text-amber-300 gap-0.5 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-current" />
              ))}
            </div>
            <p className=" text-blue-50 mb-3 ">
              {stepIndex === 0
                ? '"Payroll used to take three days of chasing spreadsheets. Now the numbers are ready the moment the pay period closes."'
                : '"Staff Time Tracker has allowed our team to set their own schedule and easily monitor their working hours and activity."'}
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/25 flex items-center justify-center text-sm ">
                {stepIndex === 0 ? "DO" : "SJ"}
              </div>
              <div className="text-xs">
                <p className="font-semibold text-white">
                  {stepIndex === 0 ? "Daniel Okafor" : "Sarah Johnson"}
                </p>
                <p className="text-xs text-blue-200">
                  {stepIndex === 0 ? "Finance Manager · Construction, 80+" : "Head of Operations · Software Development, 120+"}
                </p>
              </div>
            </div>
          </div>

          {/* 4-Step Tracker List with Connectors */}
          <div className="relative z-10 space-y-6 my-auto">
            {/* Vertical Connector Line */}
            <div className="absolute left-4 top-4 bottom-1 w-[1.5px] bg-[#FFFFFFD9]" />

            {/* Step 1: Account (Done) */}
            <div className="relative flex items-start gap-3">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-[#5383f6] text-white font-bold flex items-center justify-center text-sm backdrop-blur-sm border border-[#FFFFFFD9]">
                <Check className="h-4 w-4 stroke-[3]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className=" text-white">Account</h3>
                  <span className="py-0.5 px-2 rounded-full text-[10px] bg-[#5383f6] font-medium">Done</span>
                </div>
                <p className="text-sm font-thin">Name, work email and a password.</p>
              </div>
            </div>

            {/* Step 2: Verify email (Done) */}
            <div className="relative flex items-start gap-3">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-[#5383f6] text-white font-bold flex items-center justify-center backdrop-blur-sm border border-[#FFFFFFD9]">
                <Check className="h-4 w-4 stroke-[3]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className=" text-white">Verify email</h3>
                  <span className="py-0.5 px-2 rounded-full text-[10px] bg-[#5383f6] font-medium">Done</span>
                </div>
                <p className="text-sm font-thin">Enter the 6 digit code we send to your inbox.</p>
              </div>
            </div>

            {/* Step 3: Organization */}
            <div className="relative flex items-start gap-3">
              <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full font-bold flex items-center justify-center ${stepIndex === 0 ? "bg-white text-blue-600 shadow-md" : "bg-[#5383f6] text-white backdrop-blur-sm border border-[#FFFFFFD9]"}`}>
                {stepIndex > 0 ? <Check className="h-4 w-4 stroke-[3]" /> : "3"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className=" text-white">Organization</h3>
                  {stepIndex > 0 && <span className="py-0.5 px-2 rounded-full text-[10px] bg-[#5383f6] font-medium">Done</span>}
                </div>
                <p className="text-sm font-thin">Name, phone, time zone and address.</p>
              </div>
            </div>

            {/* Step 4: Workspace */}
            <div className="relative flex items-start gap-3">
              <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full font-bold flex items-center justify-center ${stepIndex === 1 ? "bg-white text-blue-600 shadow-md" : "bg-[#5383f6] text-white backdrop-blur-sm border border-white/25"}`}>
                4
              </div>
              <div>
                <h3 className=" text-white/90">Workspace</h3>
                <p className="text-sm font-thin">Week start, weekend, idle limit and currency.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Trust & Compliance Bar */}
      <div className="w-full max-w-[740px] bg-white dark:bg-zinc-800 rounded-3xl md:rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-zinc-700 px-6 py-3 flex flex-wrap gap-4 items-center justify-between">
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
          <span className="text-sm">SOC 2 Type II</span>
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

export default CreateOrganizationDialog;
