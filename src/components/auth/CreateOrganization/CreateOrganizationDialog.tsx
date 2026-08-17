"use client";

import { ArrowLeft, Building2, Loader2 } from "lucide-react";

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
    handleSubmit,
  } = useCreateOrganizationForm({ email, onCompleted });

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
        className="max-h-[92vh] gap-0 overflow-y-auto p-0 sm:max-w-xl dark:bg-darkSecondaryBg"
      >
        <DialogHeader className="space-y-3 border-b border-borderColor p-5 dark:border-darkBorder sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="min-w-0 text-left">
              <DialogTitle className="text-base font-semibold text-headingTextColor dark:text-darkTextPrimary sm:text-lg">
                {step.heading}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs sm:text-sm">
                {step.description}
              </DialogDescription>
            </div>
          </div>

          <OnboardingStepper steps={ORGANIZATION_STEPS} activeIndex={stepIndex} />
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate>
            <div className="p-5 sm:p-6">
              {step.id === "profile" && (
                <OrganizationProfileStep
                  control={form.control}
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

            <div className="flex flex-col gap-3 border-t border-borderColor px-5 py-4 dark:border-darkBorder sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p
                className="truncate text-xs text-subTextColor dark:text-darkTextSecondary"
                title={email}
              >
                Setting up for <span className="font-medium">{email}</span>
              </p>

              <div className="flex items-center justify-end gap-2">
                {isFirstStep ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    disabled={submitting}
                    className="text-subTextColor dark:text-darkTextSecondary"
                  >
                    Back to sign in
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline2"
                    onClick={goBack}
                    disabled={submitting}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                )}
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isLastStep
                    ? submitting
                      ? "Creating..."
                      : "Create organization"
                    : "Continue"}
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
