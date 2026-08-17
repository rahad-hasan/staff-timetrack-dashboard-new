"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createOrganization } from "@/actions/organization/action";
import {
  DEFAULT_WORKSPACE_PREFERENCES,
  resolveBrowserTimeZone,
} from "@/lib/organization";
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
    heading: "Set your workspace defaults",
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
  onCompleted,
}: UseCreateOrganizationFormOptions) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);

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
      name: "",
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
          const result = await createOrganization({ ...values, email });

          if (!result?.success || !result.data) {
            toast.error(result?.message || "Could not create your organization", {
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
    [email, form, onCompleted],
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
    step,
    stepIndex,
    isFirstStep,
    isLastStep,
    submitting: busy,
    goBack,
    goNext,
    handleSubmit,
  };
};
