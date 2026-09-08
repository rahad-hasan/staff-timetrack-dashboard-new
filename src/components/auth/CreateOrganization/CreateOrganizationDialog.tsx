"use client";

import {
  ArrowBigLeft,
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronLeft,
  Loader2,
} from "lucide-react";

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
  const data = useCreateOrganizationForm({ email, onCompleted });
  console.log(data);
  console.log(stepIndex);
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
        className={`max-h-[92vh] ${stepIndex === 1 ? " md:min-w-[700px] lg:min-w-[995px]" : "sm:max-w-xl"} gap-0 overflow-y-auto p-0 dark:bg-darkSecondaryBg`}
      >
        <DialogHeader className="space-y-3 px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
          <OnboardingStepper
            steps={ORGANIZATION_STEPS}
            activeIndex={stepIndex}
          />
          <div className="flex items-start gap-3">
            <div className="min-w-0 text-left">
              <DialogTitle className="text-xl text-headingTextColor dark:text-darkTextPrimary sm:text-4xl">
                {step.heading}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs sm:text-sm">
                {step.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} noValidate>
            <div className="px-5 sm:px-6">
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

            <div className="px-5 py-5 sm:px-6 sm:py-6">
              {isFirstStep ? (
                <div className=" flex flex-col sm:flex-row w-full items-center gap-3">
                  {/* Back to sign in — 30% */}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onOpenChange(false)}
                    disabled={submitting}
                    className="h-12 w-full sm:flex-[3] bg-[#e8e9ee] text-subTextColor dark:text-darkTextSecondary"
                  >
                    <ChevronLeft className="h-5 w-5 shrink-0" />
                    <span className="truncate">Back to sign in</span>
                  </Button>

                  {/* Continue — 70% */}
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="relative h-12 w-full sm:flex-[7]"
                  >
                    {submitting && (
                      <Loader2 className="absolute left-4 h-5 w-5 animate-spin" />
                    )}

                    <span className="whitespace-nowrap">
                      {submitting ? "Creating..." : "Continue"}
                    </span>

                    <span className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-white">
                      <ArrowRight className="h-5 w-5 text-primary" />
                    </span>
                  </Button>
                </div>
              ) : (

                <div className="flex flex-col lg:flex-row w-full items-center gap-3">
                  {/* Email — 50% */}
                  <div className="min-w-0 flex-[1]">
                    <p className="truncate text-sm">
                      Setting up for{" "}
                      <span className="text-primary">{email}</span>
                    </p>
                  </div>

                  {/* Actions — 50% */}
                  <div className="flex flex-col lg:flex-row w-full lg:flex-[1] lg:items-center gap-3">
                    {/* Back — 20% of actions */}
                    <Button
                      type="button"
                      variant="outline2"
                      onClick={goBack}
                      disabled={submitting}
                      className="h-12 w-full lg:flex-[2]"
                    >
                      <ChevronLeft className="h-5 w-5 shrink-0" />
                      <span>Back</span>
                    </Button>

                    {/* Create — 80% of actions */}
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="relative h-12 w-full lg:flex-[8]"
                    >
                      {submitting && (
                        <Loader2 className="absolute left-3 h-5 w-5 animate-spin" />
                      )}

                      <span className="whitespace-nowrap">
                        {submitting ? "Creating..." : "Create organization"}
                      </span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateOrganizationDialog;
