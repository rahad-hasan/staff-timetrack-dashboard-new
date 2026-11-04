/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import Link from "next/link";
import OtpInput from "react-otp-input";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { resetOtp, verifyOtp } from "@/actions/auth/action";
import {
  buildCreateOrganizationUrl,
  parseMarketingPlanIntent,
} from "@/lib/marketingPlanIntent";
import { storeVerifiedTrialTransition } from "@/lib/verifiedTrialTransition";
import { ArrowRight, Check, Info, ShieldCheck, Star } from "lucide-react";
import logoWithSlogan from "@/assets/logo-with-text.webp";
import logoForDark from "@/assets/logo-with-text-dark.png";
import SecureIcon from "@/components/Icons/PlanIcons/SecureIcon";
import gdpr from "@/assets/gdpr.webp";
import hipaa from "@/assets/hipaa.webp";

const OTP_LENGTH = 6;

/** Client-side pause between resends — the API additionally rate-limits. */
const RESEND_COOLDOWN_SECONDS = 60;

const errorToastStyle = {
  backgroundColor: "#ef4444",
  color: "white",
  border: "none",
} as const;

/**
 * Step one of finishing a signup that started on the marketing site: the
 * account exists as a `pendingUser` and a 6-digit code is already in the
 * user's inbox, so the marketing site hands the browser to
 * `/auth/verify-otp?email=…` and this screen turns the code into a verified
 * account.
 */
const SignupVerifyOtpClient = () => {
  const [otp, setOtp] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [width, setWidth] = useState("48px");

  const lastSubmittedCode = useRef<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  // const email = searchParams.get("email");
  const email = 'emon@gamil.com';

  // The whole screen is meaningless without the address the code was sent to.
  // useEffect(() => {
  //   if (!email) {
  //     toast.error("We lost track of your sign-up email — please sign in.", {
  //       style: errorToastStyle,
  //     });
  //     router.replace("/auth/login");
  //   }
  // }, [email, router]);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth >= 640 ? "48px" : "38px");
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setInterval(
      () => setCooldown((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleVerifyOtp() {
    if (!email || otp.length !== OTP_LENGTH || loading) return;

    lastSubmittedCode.current = otp;

    setLoading(true);
    setInlineError(null);

    let navigating = false;
    try {
      const res = await verifyOtp({
        data: {
          email,
          code: otp,
        },
      });

      if (res?.success) {
        toast.success(res?.message || "Email verified successfully");
        navigating = true;

        if (res?.data?.reset_token) {
          router.replace(
            `/auth/reset-password?reset_token=${encodeURIComponent(res.data.reset_token)}`,
          );
          return;
        }

        const verifiedEmail = res?.data?.email || email;
        const verifiedName = (res?.data?.name ?? "").trim();
        const intent = parseMarketingPlanIntent(searchParams);

        if (
          storeVerifiedTrialTransition(
            res?.data?.signup_conversion_id,
            verifiedEmail,
            { name: verifiedName, intent },
          )
        ) {
          window.location.replace("/auth/signup-verified");
          return;
        }

        router.replace(
          buildCreateOrganizationUrl(verifiedEmail, verifiedName, intent),
        );
      } else {
        const message = res?.message || "We could not verify that code.";
        setInlineError(message);
        toast.error(message, { style: errorToastStyle });
      }
    } catch (error: any) {
      toast.error(error.message || "Server is not active", {
        style: errorToastStyle,
      });
    } finally {
      if (!navigating) setLoading(false);
    }
  }

  useEffect(() => {
    if (otp.length < OTP_LENGTH) {
      lastSubmittedCode.current = null;
      return;
    }

    if (loading || lastSubmittedCode.current === otp) return;

    void handleVerifyOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, loading]);

  async function handleResendOtp() {
    if (!email || loadingResend || cooldown > 0) return;

    setLoadingResend(true);
    try {
      const res = await resetOtp({
        data: {
          email,
          reason: "sign_up",
        },
      });

      if (res?.success) {
        toast.success(res?.message || "A new code is on its way");
        setOtp("");
        setInlineError(null);
        setCooldown(RESEND_COOLDOWN_SECONDS);
      } else {
        toast.error(res?.message || "Could not resend the code", {
          style: errorToastStyle,
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Server is not active", {
        style: errorToastStyle,
      });
    } finally {
      setLoadingResend(false);
    }
  }

  if (!email) return null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 lg:p-8">
      {/* Main Container Card */}
      <div className="w-full max-w-[940px] bg-white dark:bg-zinc-900 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col lg:flex-row min-h-[580px] overflow-hidden">
        
        {/* Left Column: Form & OTP Input */}
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
                Verify your email
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm">
                We sent a 6 digit code to{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {email}
                </span>
              </p>
            </div>

            {/* OTP Input Section */}
            <div className="my-6 flex flex-col items-center">
              <OtpInput
                value={otp}
                onChange={(value: string) => {
                  setOtp(value);
                  setInlineError(null);
                }}
                numInputs={OTP_LENGTH}
                shouldAutoFocus
                renderSeparator={<span className="w-2" />}
                renderInput={(props) => (
                  <input
                    {...props}
                    style={{ width }}
                    className="h-10 md:h-12.5 rounded-xl border border-slate-200 bg-white dark:bg-zinc-800 dark:border-zinc-700 text-slate-900 dark:text-white text-center text-xl font-bold focus:border-blue-600 focus:outline-none transition-colors"
                  />
                )}
              />
            </div>

            {inlineError && (
              <p className="mb-3 text-center text-sm font-medium text-red-500">
                {inlineError}
              </p>
            )}

            {/* Submit Button */}
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== OTP_LENGTH}
              type="button"
              className="w-full h-12.5 cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-gradient-to-r from-[#0160F1] to-[#7B61FF] text-white font-medium rounded-full shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                "Verifying..."
              ) : (
                <>
                  Verify & continue <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* Resend & Action Links */}
            <div className="mt-6 space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <div>
                Didn’t receive the code?{" "}
                <button
                  onClick={handleResendOtp}
                  disabled={loadingResend || cooldown > 0}
                  className="font-semibold text-blue-600 hover:underline dark:text-blue-400 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loadingResend
                    ? "Sending..."
                    : cooldown > 0
                      ? `Resend in ${cooldown}s`
                      : "Resend"}
                </button>
              </div>
              <div>
                Wrong email?{" "}
                <Link
                  href="/auth/login"
                  className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Change it
                </Link>
              </div>
            </div>

            {/* Info Callout Box */}
            <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 flex items-start gap-3">
              <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Can’t see it? Check Spam or Promotions — the code is valid for
                10 minutes.
              </p>
            </div>
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

        {/* Right Column: Hero Banner & 4-Step Progress Track */}
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
            <div className="relative z-10 text-xs font-semibold tracking-wider uppercase text-blue-100 mb-4">
              STEP 2 / 4
            </div>
            <h2 className="relative z-10 text-2xl md:text-3xl font-semibold mb-6">
              Start free in four quick steps
            </h2>

            {/* Testimonial Card */}
            <div className="relative z-10 bg-white/10 backdrop-blur-[2px] border border-white/20 rounded-2xl p-5 mb-8">
              <div className="flex items-center text-amber-300 gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-current" />
                ))}
              </div>
              <blockquote className="text-sm text-blue-50 font-normal mb-4">
                &ldquo;We cut our weekly timesheet admin from six hours to under
                one. Billing clients is now accurate down to the minute.&rdquo;
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/25 border border-white/40 flex items-center justify-center font-bold text-xs">
                  MR
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">
                    Marcus Reyes
                  </div>
                  <div className="text-[11px] text-blue-100/80">
                    Project Director · Marketing Agency, 45+
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step Track */}
          <div className="relative z-10 space-y-6 my-auto">
            {/* Vertical Connector Line */}
            <div className="absolute left-4 top-4 bottom-1 w-[1.5px] bg-white/30" />

            {/* Step 1: Account (Done) */}
            <div className="relative flex items-start gap-3.5">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white/25 text-white font-bold flex items-center justify-center text-sm backdrop-blur-sm border border-[#FFFFFFD9]">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white text-base">Account</h3>
                  <span className="py-0.5 px-2 rounded-full text-xs bg-white/20 font-medium">
                    Done
                  </span>
                </div>
                <p className="text-xs text-blue-100 mt-0.5 font-light">
                  Name, work email and a password.
                </p>
              </div>
            </div>

            {/* Step 2: Verify email (Active) */}
            <div className="relative flex items-start gap-3.5">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-white text-blue-600 font-bold flex items-center justify-center text-sm shadow-md">
                2
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">
                  Verify email
                </h3>
                <p className="text-xs text-blue-100 mt-0.5 font-light">
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
                <p className="text-xs text-blue-100/70 mt-0.5 font-light">
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
                <p className="text-xs text-blue-100/70 mt-0.5 font-light">
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

export default SignupVerifyOtpClient;