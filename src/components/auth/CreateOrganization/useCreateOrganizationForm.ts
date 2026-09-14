"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createOrganization } from "@/actions/organization/action";
import { parseMarketingPlanIntent } from "@/lib/marketingPlanIntent";
import {
  COMPANY_EMAIL_EXISTS_MESSAGE,
  DEFAULT_WORKSPACE_PREFERENCES,
  PENDING_USER_MISSING_MESSAGE,
  resolveBrowserTimeZone,
} from "@/lib/organization";
import { buildOrgNameSuggestions } from "@/lib/orgNameSuggestions";
import { ICreateOrganizationResponse } from "@/types/type";
import {
  CreateOrganizationFormValues,
  createOrganizationSchema,
} from "@/zod/schema";

export const ORGANIZATION_STEPS = [
  {
    id: "profile",
    title: "Organization",
    heading: "Tell us about your organization",
    description:
      "This is what your team and your invoices will be identified by.",
    fields: ["name", "phone", "time_zone", "address"],
  },
  {
    id: "workspace",
    title: "Workspace",
    heading: "Set Your Default Workspace",
    description:
      "How the week is counted, when a session goes idle, and what you bill in.",
    fields: [
      "week_start",
      "weekly_leave_count",
      "idle_minutes_limit",
      "currency",
    ],
  },
] as const satisfies ReadonlyArray<{
  id: string;
  title: string;
  heading: string;
  description: string;
  fields: ReadonlyArray<keyof CreateOrganizationFormValues>;
}>;

interface UseCreateOrganizationFormOptions {
  /** Comes from the sign-in response — never edited, never displayed as input. */
  email: string;
  /** From `verify-otp`; absent on the login-page entry point into this dialog. */
  userName?: string;
  onCompleted: (organization: ICreateOrganizationResponse) => void;
}

/**
 * Owns the wizard: one form across every step, per-step validation on the way
 * forward, and a single submit that hands the finished session back to the
 * caller.
 *
 * Validation is scoped per step so a blank field on a later step never blocks
 * "Continue", while the final submit still runs the whole schema.
 */
export const useCreateOrganizationForm = ({
  email,
  userName,
  onCompleted,
}: UseCreateOrganizationFormOptions) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * The plan the visitor clicked "start a trial" on, on the marketing site —
   * `/auth/verify-otp?email=…&plan=2&trail=true`, carried to this URL by the
   * hop before this one.
   *
   * Read off the live URL rather than passed in, for the same reason
   * `useEnterPlanSelection` does it: the login page mounts this very wizard for
   * accounts that verified but never finished, and that URL simply carries no
   * plan params — which parses to "no intent" and costs that call site nothing.
   * Both pages that mount the dialog already read `useSearchParams`, so this
   * adds no new Suspense boundary.
   *
   * Only a TRIAL intent that actually names a plan produces an id. A paid-plan
   * click (`trail=false`) has nothing to do with the reverse trial — it is
   * routed to the plan picker and buys a subscription there — so it must leave
   * the create request untouched.
   *
   * Nothing here judges whether that plan HAS a trial: the client cannot know
   * (`IBillingPlan` carries neither `allow_trial` nor `trial_days`) and must not
   * pretend to. `POST /company` validates the id and falls back to the default
   * trial plan when it is unknown, inactive or not trialable. This is intent,
   * not an assertion — do not "fix" it later by filtering against the catalog.
   */
  const trialPlanId = useMemo(() => {
    const intent = parseMarketingPlanIntent(searchParams);
    return intent.isTrial ? intent.planId : null;
  }, [searchParams]);

  /**
   * Owned here rather than in the step, because the FIRST suggestion is also
   * the field's default value — computing them in two places is how those two
   * drift apart and the pre-filled name stops matching the chip beside it.
   *
   * Pure and deterministic, so this memo is about identity, not cost.
   */
  const suggestions = useMemo(
    () => buildOrgNameSuggestions(userName, email),
    [userName, email],
  );

  // All three generics are pinned on purpose: left to inference, the resolver
  // leaves `TTransformedValues` unresolved and `form.control` stops matching
  // the `Control<CreateOrganizationFormValues>` the step components declare.
  const form = useForm<
    CreateOrganizationFormValues,
    unknown,
    CreateOrganizationFormValues
  >({
    resolver: zodResolver(createOrganizationSchema),
    mode: "onTouched",
    defaultValues: {
      // Pre-filled with the best suggestion so the common case is "read it,
      // press Continue". It is an ordinary editable value, not a placeholder —
      // the user can clear or rewrite it, and the schema still has the final
      // say. Empty when there was no usable seed.
      name: suggestions[0] ?? "",
      phone: "",
      address: "",
      // The dialog only ever mounts client-side, so reading the browser zone
      // here cannot desync a server-rendered pass.
      time_zone: resolveBrowserTimeZone(),
      ...DEFAULT_WORKSPACE_PREFERENCES,
    },
  });

  const step = ORGANIZATION_STEPS[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === ORGANIZATION_STEPS.length - 1;

  /**
   * `submitting` is only raised once the resolver has passed, which leaves a
   * window where a second click could start a second `POST /company`. RHF flips
   * `isSubmitting` synchronously as `handleSubmit` begins, so the union closes
   * it — while `submitting` alone keeps the form locked after success, when
   * `isSubmitting` has already gone back to false.
   */
  const busy = submitting || form.formState.isSubmitting;

  const goBack = useCallback(() => {
    setStepIndex((index) => Math.max(0, index - 1));
  }, []);

  /**
   * Fills the name field from a suggestion chip.
   *
   * `clearErrors` rather than `shouldValidate: true`, for two reasons. Every
   * suggestion is pre-clamped to the schema's 2–50 bound, so there is nothing
   * to validate at pick time — clearing a stale message (from an earlier blur
   * on a half-typed name) is the whole job. And re-running the resolver here
   * is what a picked name least needs: real validation still happens on blur
   * under `onTouched`, and again across the step when "Continue" triggers it.
   *
   * Note the flash this does NOT fix: clicking a chip used to blur the
   * autofocused, still-empty name input, and `onTouched` painted the
   * min-length error a frame before the click handler filled it. That is
   * solved where it is caused — `OrgNameSuggestions` suppresses the chip's
   * default mousedown focus shift, so no blur happens at all.
   */
  const setOrgName = useCallback(
    (value: string) => {
      form.setValue("name", value, { shouldDirty: true });
      form.clearErrors("name");
    },
    [form],
  );

  const goNext = useCallback(async () => {
    const valid = await form.trigger([...step.fields]);

    if (valid) {
      setStepIndex((index) =>
        Math.min(ORGANIZATION_STEPS.length - 1, index + 1),
      );
    }
  }, [form, step]);

  const runSubmit = useMemo(
    () =>
      form.handleSubmit(async (values) => {
        setSubmitting(true);

        try {
          // `trialPlanId` is null for every signup that did not arrive from a
          // marketing trial link, which keeps that request exactly as it was.
          const result = await createOrganization(
            { ...values, email },
            trialPlanId,
          );

          if (!result?.success || !result.data) {
            const message = result?.message ?? "";

            // Two rejections are terminal — resubmitting the wizard can never
            // clear them, so route to sign-in instead of stranding the user
            // in a retry loop. `submitting` stays raised while the route
            // changes, same as the success path.
            if (message === COMPANY_EMAIL_EXISTS_MESSAGE) {
              toast.warning(
                "This email already belongs to a workspace — sign in to continue.",
              );
              router.replace(`/auth/login?email=${encodeURIComponent(email)}`);
              return;
            }

            if (message === PENDING_USER_MISSING_MESSAGE) {
              toast.error(
                "We couldn't find a verified sign-up for this email. Please sign up again, or sign in if you already have an account.",
                {
                  style: {
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                  },
                },
              );
              router.replace(`/auth/login?email=${encodeURIComponent(email)}`);
              return;
            }

            toast.error(message || "Could not create your organization", {
              style: {
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
              },
            });
            setSubmitting(false);
            return;
          }

          toast.success(result.message || "Organization created successfully");
          // The company exists and the session is live even when a follow-up
          // preference write failed — say so, then keep going.
          result.warnings?.forEach((warning) => toast.warning(warning));

          // Deliberately stays in the submitting state: `onCompleted` routes to
          // the dashboard, and re-enabling the form first would flash an
          // editable wizard over an organization that already exists.
          onCompleted(result.data);
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "Something went wrong!",
            {
              style: {
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
              },
            },
          );
          setSubmitting(false);
        }
      }),
    [email, form, onCompleted, router, trialPlanId],
  );

  /**
   * Every step shares one `<form>`, so pressing Enter anywhere would otherwise
   * submit straight from step 1 — the later fields all hold valid defaults.
   * Until the last step, Enter and the primary button advance instead.
   */
  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      if (busy) {
        event.preventDefault();
        return;
      }

      if (!isLastStep) {
        event.preventDefault();
        void goNext();
        return;
      }

      void runSubmit(event);
    },
    [busy, goNext, isLastStep, runSubmit],
  );

  return {
    form,
    suggestions,
    step,
    stepIndex,
    isFirstStep,
    isLastStep,
    submitting: busy,
    goBack,
    goNext,
    setOrgName,
    handleSubmit,
  };
};
