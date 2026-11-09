"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { createAccount } from "@/actions/auth/action";
import {
  appendMarketingPlanIntent,
  parseMarketingPlanIntent,
} from "@/lib/marketingPlanIntent";

type SignUpValues = z.infer<typeof signUpSchema>;

const SIGN_UP_FIELDS = ["name", "email", "password"] as const;
type SignUpField = (typeof SIGN_UP_FIELDS)[number];

/** The shape `baseApi` hands back for `POST /auth/create-account`. */
type CreateAccountResponse = {
  success?: boolean;
  message?: string;
  statusCode?: number;
  /** Backend Zod issues, e.g. `{ path: "body.email", message: "…" }`. */
  errorMessages?: Array<{ path?: unknown; message?: unknown }>;
};

/** `"body.email"` → `"email"`, or null when the issue is not about a field on this form. */
const toFormField = (path: unknown): SignUpField | null => {
  if (typeof path !== "string") return null;
  const key = path.replace(/^body\./, "");
  return (SIGN_UP_FIELDS as readonly string[]).includes(key)
    ? (key as SignUpField)
    : null;
};

const GENERIC_ERROR = "Unable to create your account. Please try again.";

const SignUp = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  // The address already belongs to a real account: show a way to log in.
  const [emailTaken, setEmailTaken] = useState(false);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const passwordValue = form.watch("password") || "";
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

  const handleSubmit = async (values: SignUpValues) => {
    if (!agreeTerms) {
      toast.error(
        "Please agree to the Terms, Privacy Policy, and DPA to continue.",
      );
      return;
    }

    const email = values.email.trim();
    setEmailTaken(false);
    setLoading(true);

    // Stays true once we head to the code screen, so the button cannot be
    // pressed again mid-navigation: a second submit would email a fresh code
    // and silently invalidate the one the user is about to type.
    let navigating = false;
    try {
      const response = (await createAccount({
        name: values.name.trim(),
        email,
        password: values.password,
      })) as CreateAccountResponse | undefined;

      if (response?.success) {
        toast.success("We sent a 6 digit code to your email.");
        navigating = true;
        // A plan picked on the marketing site rides along to the code screen,
        // which forwards it to create-organization (see marketingPlanIntent).
        router.push(
          appendMarketingPlanIntent(
            `/auth/verify-otp?email=${encodeURIComponent(email)}`,
            parseMarketingPlanIntent(searchParams),
          ),
        );
        return;
      }

      // 409 = a real (non-pending) account already owns this address.
      if (response?.statusCode === 409) {
        setEmailTaken(true);
        form.setError(
          "email",
          {
            type: "server",
            message: "An account with this email already exists.",
          },
          { shouldFocus: true },
        );
        return;
      }

      // Validation errors from the API go under the field they belong to.
      let shownOnField = false;
      for (const issue of response?.errorMessages ?? []) {
        const field = toFormField(issue?.path);
        if (!field || typeof issue.message !== "string") continue;
        form.setError(
          field,
          { type: "server", message: issue.message },
          { shouldFocus: !shownOnField },
        );
        shownOnField = true;
      }

      if (!shownOnField) toast.error(response?.message || GENERIC_ERROR);
    } catch {
      // The server action itself failed to reach the Next server.
      toast.error("Unable to connect to the server. Please try again.");
    } finally {
      if (!navigating) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 lg:p-8">
      <OnboardingBackdrop />
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
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-5"
              >
                {/* Full Name Input */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            placeholder="Full Name"
                            autoComplete="name"
                            maxLength={30}
                            className="h-12.5 rounded-xl border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Work Email Input */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                        Work email
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            type="email"
                            placeholder="name@company.com"
                            autoComplete="email"
                            className="h-12.5 rounded-xl border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                            {...field}
                            onChange={(event) => {
                              field.onChange(event);
                              if (emailTaken) setEmailTaken(false);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                      {emailTaken && (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          <Link
                            href={`/auth/login?email=${encodeURIComponent(field.value.trim())}`}
                            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                          >
                            Log in instead
                          </Link>{" "}
                          or{" "}
                          <Link
                            href="/auth/forgot-password"
                            className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                          >
                            reset your password
                          </Link>
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                {/* Password Input */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="font-semibold text-slate-700 dark:text-slate-300">
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            autoComplete="new-password"
                            className="h-12.5 rounded-xl border-slate-200 bg-white pl-10 pr-10 text-slate-900 placeholder:text-slate-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
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
                            <span className="w-0.5 h-0.5 rounded-full bg-slate-600"></span>{" "}
                            {passwordStrengthHint}
                          </p>
                          <span
                            className={`font-semibold ${
                              passwordStrength >= 4
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {passwordStrengthLabel}
                          </span>
                        </div>
                      </div>
                    </FormItem>
                  )}
                />

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
                    {/* New tab: following a legal link must not throw away
                        what the user has already typed into this form. */}
                    I agree to the{" "}
                    <a
                      href="https://stafftimetracker.org/terms-and-conditions/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400 font-medium"
                    >
                      Terms
                    </a>
                    ,{" "}
                    <a
                      href="https://stafftimetracker.org/privacy-policy/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400 font-medium"
                    >
                      Privacy policy
                    </a>{" "}
                    and{" "}
                    <a
                      href="https://stafftimetracker.org/data-processing-agreement/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400 font-medium"
                    >
                      DPA
                    </a>
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
        <div className="lg:w-1/2 m-2 bg-gradient-to-br from-[#0160F1] via-[#4c60fa] to-[#7B61FF] p-6 sm:p-8 lg:p-10 text-white flex flex-col justify-between relative overflow-hidden rounded-[20px] lg:rounded-[24px]">
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
            <h2 className="relative z-10 text-2xl md:text-3xl font-bold mb-6 leading-tight text-balance">
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
            {/* Each step but the last draws its own segment, from the bottom of its
                bubble to the top of the next one (`-bottom-6` matches `space-y-6`). One
                line for the whole list overshot the last bubble whenever the
                descriptions wrapped, which they do on phones. */}

            {/* Step 1: Account (Active) */}
            <div className="relative flex items-start gap-3.5">
              <div aria-hidden="true" className="absolute left-4 top-8 -bottom-6 w-[1.5px] -translate-x-1/2 bg-white/30" />
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
              <div aria-hidden="true" className="absolute left-4 top-8 -bottom-6 w-[1.5px] -translate-x-1/2 bg-white/30" />
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
              <div aria-hidden="true" className="absolute left-4 top-8 -bottom-6 w-[1.5px] -translate-x-1/2 bg-white/30" />
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

// `useSearchParams` (for a carried-over plan intent) needs a Suspense boundary,
// or Next bails this route out of static prerendering at build time.
export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUp />
    </Suspense>
  );
}
