/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import roundedEmail from "../../assets/auth/roundedEmail.svg";
import OtpInput from "react-otp-input";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { resetOtp, verifyOtp } from "@/actions/auth/action";
import {
  buildCreateOrganizationUrl,
  parseMarketingPlanIntent,
} from "@/lib/marketingPlanIntent";
import logoWithSlogan from "../../assets/logo-with-text.webp";
import logoForDark from "../../assets/logo-with-text-dark.png";
import { storeVerifiedTrialTransition } from "@/lib/verifiedTrialTransition";

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
 *
 * `POST /auth/verify-otp` answers the sign-up flow with
 * `{ redirect: "/create-organization", email, name }` — no session tokens yet (the
 * bundled accessToken is signed for the pending record and is useless against
 * authenticated routes, so it is deliberately never persisted). The session
 * only begins when `POST /company` completes on the next screen.
 *
 * When the visitor arrived from the marketing pricing page the URL also carries
 * the plan they already picked (`?plan=&cycle=&trial=`). Nothing here acts on
 * it — this screen only forwards it, because the decision it feeds cannot be
 * made until the company exists two screens from now. BOTH ways out of this
 * screen forward it: directly on the next URL, or, when the Google Ads
 * conversion hop runs, through the storage record `/auth/signup-verified`
 * restores it from. See `@/lib/marketingPlanIntent`.
 */
const SignupVerifyOtpClient = () => {
  const [otp, setOtp] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [width, setWidth] = useState("50px");
  /**
   * The exact code the last submission was made with.
   *
   * This is what stops the auto-submit below from becoming a retry loop: a
   * rejected code stays in the boxes, so without remembering that it has
   * already been tried, every re-render that re-evaluates "the field is full"
   * would fire another request at the API with the same wrong digits.
   */
  const lastSubmittedCode = useRef<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  // The whole screen is meaningless without the address the code was sent to.
  useEffect(() => {
    if (!email) {
      toast.error("We lost track of your sign-up email — please sign in.", {
        style: errorToastStyle,
      });
      router.replace("/auth/login");
    }
  }, [email, router]);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth >= 640 ? "50px" : "40px");
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

    // Recorded here rather than in the auto-submit effect so a manual click
    // counts as an attempt too — otherwise the effect would immediately
    // re-fire the same code the button just failed with.
    lastSubmittedCode.current = otp;

    setLoading(true);
    setInlineError(null);
    // Verification consumes the OTP row server-side, so a re-click during the
    // route transition would answer "OTP not found" over a verification that
    // just succeeded — stay latched once the navigation is under way (the
    // same rule CheckoutDialog's redirect and the wizard's submit follow).
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

        // The sign-up flow answers `/create-organization`. A stale
        // forgot-password code for the same address answers
        // `/reset-password` + reset_token instead — honour it rather than
        // walking a password reset into company creation. That branch stays
        // free of plan params on purpose: a password reset is not a signup and
        // has nothing to buy at the end of it.
        // `replace`, not `push`: the code is consumed, so returning here via
        // the Back button could only replay a step that must now fail.
        if (res?.data?.reset_token) {
          router.replace(
            `/auth/reset-password?reset_token=${encodeURIComponent(res.data.reset_token)}`,
          );
          return;
        }

        // Everything the next screen needs is gathered BEFORE either exit
        // below, because both exits need all of it. Computing the onward
        // context only on the path that happened to be written second is
        // exactly how the tracking hop below came to swallow it whole.
        const verifiedEmail = res?.data?.email || email;

        // The verify response carries the signed-up person's name, and this is
        // the only moment it is in hand: the next screen has no session to look
        // it up with, so anything dropped here is gone. It seeds the
        // organization-name suggestions on step 1.
        const verifiedName = (res?.data?.name ?? "").trim();

        // The plan intent, if this signup carries one. Re-read rather than
        // re-encoded blindly, so a junk `?plan=` is dropped here instead of
        // travelling two more screens, and so the `trail`/`trial` spelling is
        // normalised at the first opportunity. Parses to nothing at all for an
        // ordinary signup, which costs that path exactly nothing.
        const intent = parseMarketingPlanIntent(searchParams);

        // Only the server's signup-specific success response supplies this ID.
        // Never load third-party tracking on the email-bearing OTP URL — which
        // is why the conversion fires on a bare `/auth/signup-verified` and the
        // onboarding context rides in storage rather than on that URL.
        //
        // That detour is a SECOND route to the same next screen, so it is
        // handed the same name and intent this function already holds; it then
        // rebuilds one identical URL through `buildCreateOrganizationUrl`.
        // Passing them is not optional — an earlier version returned here with
        // the email alone, and everything else was lost on this line.
        //
        // If storage is unavailable, keep the original onboarding flow intact.
        if (storeVerifiedTrialTransition(
          res?.data?.signup_conversion_id,
          verifiedEmail,
          { name: verifiedName, intent },
        )) {
          window.location.replace("/auth/signup-verified");
          return;
        }

        router.replace(
          buildCreateOrganizationUrl(verifiedEmail, verifiedName, intent),
        );
      } else {
        // Wrong code / expired code / rate limited — the API message says
        // which; keep it on screen so it survives the toast.
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

  /**
   * Submit as soon as the sixth digit lands — pasting a code from the email
   * client, or typing the last digit, should not then require a separate click
   * on a button that is the only thing left to do.
   *
   * Three guards keep it from misfiring:
   *   - a short code resets the attempt marker, so correcting a digit (or a
   *     resend clearing the field) makes the corrected code submittable again,
   *     including when it happens to match one already tried;
   *   - `loading` keeps a completed code from queueing a second request while
   *     the first is still in flight;
   *   - `lastSubmittedCode` stops a REJECTED code from resubmitting itself.
   *     That one is the important one: the wrong digits stay on screen after a
   *     failure, so without it this effect would hammer the endpoint until the
   *     rate limiter cut it off.
   *
   * The button stays: it is the accessible, obvious control, and it still
   * handles the case where an attempt was already spent on these digits.
   */
  useEffect(() => {
    if (otp.length < OTP_LENGTH) {
      lastSubmittedCode.current = null;
      return;
    }

    if (loading || lastSubmittedCode.current === otp) return;

    void handleVerifyOtp();
    // `handleVerifyOtp` is redeclared every render, so listing it here would
    // re-run this effect on every render. The guards above are what make the
    // submission idempotent, not the dependency list.
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
    <div className="w-full min-h-screen bg-linear-to-b from-[#12cd6918] from-5% to-bgSecondary dark:to-darkSecondaryBg to-20%">
      <div className="w-full flex items-center justify-center">
        <div className="flex items-center gap-1.5 px-8 py-5">
          <Image
            src={logoWithSlogan}
            alt="Logo"
            width={120}
            height={60}
            className="hidden dark:block"
          />
          <Image
            src={logoForDark}
            alt="Logo"
            width={120}
            height={60}
            className="dark:hidden"
          />
        </div>
      </div>
      <div className="h-[80vh] flex items-center justify-center px-4">
        <div
          style={{ boxShadow: "0px 10px 180px rgba(18, 205, 105, 0.3)" }}
          className="space-y-2 md:space-y-4 bg-white dark:bg-darkPrimaryBg py-8 px-6 md:px-10 rounded-lg border border-borderColor dark:border-darkBorder"
        >
          <div className="flex flex-col items-center mb-5">
            <Image
              src={roundedEmail}
              width={200}
              height={200}
              alt="icon"
              className="w-16"
            />
            <h2 className="text-2xl font-medium mt-4 mb-2">
              Verify your email
            </h2>
            <p className="text-center text-subTextColor dark:text-darkTextSecondary">
              We sent a 6 digit code to{" "}
              <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                {email}
              </span>
            </p>
          </div>
          <div className="flex justify-center">
            <div className="flex gap-2 mb-2 md:mb-4">
              <OtpInput
                value={otp}
                onChange={(value: string) => {
                  setOtp(value);
                  setInlineError(null);
                }}
                numInputs={OTP_LENGTH}
                shouldAutoFocus
                renderSeparator={<span className="w-2 md:w-4" />}
                renderInput={(props) => (
                  <input
                    {...props}
                    style={{ width: width }}
                    className="responsive-otp-input w-12 h-10 md:h-12 border border-borderColor dark:border-darkBorder rounded-md text-center text-lg focus:border-primary focus:outline-none"
                  />
                )}
              />
            </div>
          </div>

          {inlineError && (
            <p className="text-center text-sm text-red-500">{inlineError}</p>
          )}

          <Button
            onClick={handleVerifyOtp}
            disabled={loading || otp.length !== OTP_LENGTH}
            className="w-full"
            type="button"
          >
            {loading ? "Verifying..." : "Verify & continue"}
          </Button>
          <h3 className="text-center mt-3">
            Didn&apos;t receive the code?{" "}
            <button
              onClick={handleResendOtp}
              disabled={loadingResend || cooldown > 0}
              className="text-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingResend
                ? "Sending..."
                : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : "Resend"}
            </button>
          </h3>
          <p className="text-center text-sm text-subTextColor dark:text-darkTextSecondary">
            Wrong account?{" "}
            <Link href="/auth/login" className="text-primary">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupVerifyOtpClient;
