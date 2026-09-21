"use client";

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { ICreateOrganizationResponse } from "@/types/type";
import OnboardingStepper from "./OnboardingStepper";
import OrganizationProfileStep from "./OrganizationProfileStep";
import WorkspacePreferencesStep from "./WorkspacePreferencesStep";
import {
  ORGANIZATION_STEPS,
  useCreateOrganizationForm,
} from "./useCreateOrganizationForm";

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

/**
 * Finishes a signup that started on the marketing site.
 *
 * The account is verified but has no company yet, so `POST /auth/signin`
 * answers with `{ redirect: "/create-organization" }` and no tokens. This is
 * the step that turns it into a real workspace.
 *
 * Until it succeeds there is no session at all, so leaving has to be a
 * deliberate act: clicking the backdrop never dismisses, and nothing dismisses
 * mid-submit. Escape and "Back to sign in" remain as the way out.
 */
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

  const blockWhileSubmitting = (event: Event) => {
    if (submitting) {
      event.preventDefault();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (submitting) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={blockWhileSubmitting}
        // Wider than the app's other dialogs on purpose: step 2 lays out seven
        // weekday pills in a row beside the weekend-length row, and at `xl`
        // they wrapped to 4 + 3 and broke the two-column rhythm the design
        // draws. `2xl` is the narrowest step that keeps the week on one line.
        className={`max-h-[92vh] ${stepIndex === 1 ? " md:min-w-[700px] lg:min-w-[995px]" : "sm:max-w-xl"} gap-0 overflow-y-auto p-0 dark:bg-darkSecondaryBg`}
      >
        <DialogHeader className="space-y-3 px-5 sm:px-6 pt-5 sm:pt-5">
          <OnboardingStepper
            steps={ORGANIZATION_STEPS}
            activeIndex={stepIndex}
            variant="bar"
          />
          <div className="flex items-start gap-3">
            {/* <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </span> */}
            <div className="min-w-0 text-left">
              <DialogTitle className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary sm:text-4xl">
                {step.heading}
              </DialogTitle>
              <DialogDescription className="mt-3 text-xs sm:text-sm">
                {step.description}
              </DialogDescription>
            </div>
          </div>

          {/* A two-step wizard does not need per-step badges to orient anyone —
              the header already names the step — so the design spends the row
              on a single fill instead. */}
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate>
            <div className="p-5 sm:p-6">
              {step.id === "profile" && (
                <OrganizationProfileStep
                  control={form.control}
                  suggestions={suggestions}
                  onPickSuggestion={setOrgName}
                  disabled={submitting}
                />
              )}
              {step.id === "workspace" && (
                <WorkspacePreferencesStep
                  control={form.control}
                  disabled={submitting}
                />
              )}
            </div>

            <div className="flex flex-col gap-3 px-5 pb-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              {/* The left slot carries the step's own escape hatch on step 1
                  (there is no session to fall back to, so leaving means
                  sign-in) and the address the workspace is about to be created
                  for on the last step, where it is the final thing worth
                  double-checking before submitting. */}
              {isFirstStep ? (
                <Button
                  type="button"
                  variant="outline2"
                  onClick={() => onOpenChange(false)}
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft className="size-4" />
                  Back to sign in
                </Button>
              ) : (
                <p
                  className="truncate text-xs text-subTextColor dark:text-darkTextSecondary"
                  title={email}
                >
                  Setting up for{" "}
                  <span className="font-medium text-primary">{email}</span>
                </p>
              )}

              {/* Stacked on a phone the footer is the whole bottom of the
                  screen, so the actions take the full width there and only
                  shrink to their labels once the row goes horizontal. */}
              <div
                className={`flex w-full items-center justify-end gap-2 ${
                  isFirstStep ? "" : "sm:w-auto"
                }`}
              >
                {!isFirstStep && (
                  <Button
                    type="button"
                    variant="outline2"
                    onClick={goBack}
                    disabled={submitting}
                    className="flex-1 sm:flex-none"
                  >
                    <ArrowLeft className="size-4" />
                    Back
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className={isFirstStep ? "w-full" : "w-full sm:w-auto"}
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  {isLastStep
                    ? submitting
                      ? "Creating..."
                      : "Create Organization"
                    : "Continue"}
                  {!isLastStep && <ArrowRight className="size-4" />}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrganizationDialog;
