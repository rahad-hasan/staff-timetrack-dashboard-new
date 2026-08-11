"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  Loader2,
  Lock,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  IDowngradePreview,
  IDowngradeResolveResult,
} from "@/types/billing";
import { resolveDowngrade } from "@/actions/billing/action";
import { formatBillingDate } from "@/lib/billing";
import { useLogInUserStore } from "@/store/logInUserStore";

type WizardStep = "users" | "projects" | "review";

/**
 * Trial-expiry downgrade selection wizard (guide §6). Only renders the steps
 * whose `needs_*` flag is true. The acting admin is always kept: preselected,
 * locked (lock icon), always part of `keep_user_ids` — they consume a seat
 * (the counter includes them) but never a click.
 */
export default function DowngradeWizard({
  preview,
  onResolved,
}: {
  preview: IDowngradePreview;
  onResolved: () => void;
}) {
  const { logInUserData } = useLogInUserStore();

  const actingId = useMemo(() => {
    const raw = logInUserData?.id;
    const n = typeof raw === "number" ? raw : Number(raw);
    return Number.isFinite(n) ? n : null;
  }, [logInUserData]);

  const steps = useMemo<WizardStep[]>(
    () => [
      ...(preview.needs_user_selection ? (["users"] as WizardStep[]) : []),
      ...(preview.needs_project_selection
        ? (["projects"] as WizardStep[])
        : []),
      "review" as WizardStep,
    ],
    [preview.needs_user_selection, preview.needs_project_selection],
  );

  const [stepIndex, setStepIndex] = useState(0);
  // Acting admin is always in the keep list from the start and can never leave it.
  const [keepUsers, setKeepUsers] = useState<number[]>(() =>
    actingId !== null ? [actingId] : [],
  );
  const [keepProjects, setKeepProjects] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<IDowngradeResolveResult | null>(null);

  const step = steps[stepIndex];

  const userAtCap = keepUsers.length >= preview.max_seats;
  const projectAtCap = keepProjects.length >= preview.max_projects;

  const toggleUser = (id: number) => {
    if (id === actingId) return; // locked — the acting admin is always kept
    setKeepUsers((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= preview.max_seats) return prev;
      return [...prev, id];
    });
  };

  const toggleProject = (id: number) => {
    setKeepProjects((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= preview.max_projects) return prev;
      return [...prev, id];
    });
  };

  // When a selection step isn't needed, everything in that category fits — keep it all.
  const keepUserIds = preview.needs_user_selection
    ? keepUsers
    : preview.active_users.map((u) => u.id);
  const keepProjectIds = preview.needs_project_selection
    ? keepProjects
    : preview.active_projects.map((p) => p.id);

  const keepUserSet = new Set(keepUserIds);
  const keepProjectSet = new Set(keepProjectIds);
  const membersDeactivated = preview.active_users.filter(
    (u) => !keepUserSet.has(u.id),
  ).length;
  const projectsArchived = preview.active_projects.filter(
    (p) => !keepProjectSet.has(p.id),
  ).length;

  const handleConfirm = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await resolveDowngrade({
        keep_user_ids: keepUserIds,
        keep_project_ids: keepProjectIds,
      });
      if (res?.success && res.data) {
        setResult(res.data);
        onResolved();
      } else {
        setSubmitError(
          res?.message || "Could not apply your selection. Please try again.",
        );
      }
    } catch {
      toast.error("Something went wrong while applying your selection.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- success summary (after resolve) ---------------- */
  if (result) {
    return (
      <div className="border border-borderColor rounded-lg p-3 sm:p-4 bg-white dark:bg-darkPrimaryBg dark:border-darkBorder">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">
            Downgrade applied
          </h3>
          <p className="max-w-md text-sm text-subTextColor dark:text-darkTextSecondary">
            {result.parked_users} member(s) parked and {result.archived_projects}{" "}
            project(s) archived. Nothing was deleted — upgrade any time to
            restore them with one click.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-borderColor rounded-lg p-3 sm:p-4 bg-white dark:bg-darkPrimaryBg dark:border-darkBorder">
      {/* step indicator */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-subTextColor dark:text-darkTextSecondary">
          Step {stepIndex + 1} of {steps.length}
        </p>
        <div className="flex items-center gap-1.5">
          {steps.map((s, i) => (
            <span
              key={s}
              className={cn(
                "h-1.5 w-6 rounded-full",
                i <= stepIndex
                  ? "bg-primary"
                  : "bg-bgSecondary dark:bg-darkSecondaryBg",
              )}
            />
          ))}
        </div>
      </div>

      {/* ---------------- users step ---------------- */}
      {step === "users" && (
        <div>
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-base font-medium text-headingTextColor dark:text-darkTextPrimary">
                Choose which members stay active
              </h3>
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                userAtCap
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-subTextColor dark:text-darkTextSecondary",
              )}
            >
              {keepUsers.length} of {preview.max_seats} selected
            </span>
          </div>
          <p className="mb-3 text-sm text-subTextColor dark:text-darkTextSecondary">
            The {preview.target_plan.name} plan includes up to{" "}
            {preview.max_seats} seat(s). Your own account is always kept.
          </p>
          <ul className="max-h-72 overflow-y-auto rounded-lg border border-borderColor dark:border-darkBorder divide-y divide-borderColor dark:divide-darkBorder">
            {preview.active_users.map((user) => {
              const isSelf = actingId !== null && user.id === actingId;
              const checked = keepUsers.includes(user.id);
              const disabled = isSelf || (!checked && userAtCap);
              return (
                <li key={user.id}>
                  <div
                    onClick={() => {
                      if (!disabled) toggleUser(user.id);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                      !disabled &&
                        "cursor-pointer hover:bg-bgSecondary dark:hover:bg-darkSecondaryBg",
                      disabled && !isSelf && "opacity-50 cursor-not-allowed",
                      isSelf && "bg-bgSecondary/60 dark:bg-darkSecondaryBg/60",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={() => toggleUser(user.id)}
                      aria-label={`Keep ${user.name}`}
                      className="pointer-events-none"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                          {user.name}
                        </span>
                        {isSelf && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                            <Lock className="h-3 w-3" />
                            You — always kept
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-subTextColor dark:text-darkTextSecondary">
                        {user.email}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-bgSecondary px-2 py-0.5 text-[11px] font-medium capitalize text-subTextColor dark:bg-darkSecondaryBg dark:text-darkTextSecondary">
                      {user.role}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          {userAtCap && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Seat limit reached — uncheck someone to pick a different member.
            </p>
          )}
        </div>
      )}

      {/* ---------------- projects step ---------------- */}
      {step === "projects" && (
        <div>
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-primary" />
              <h3 className="text-base font-medium text-headingTextColor dark:text-darkTextPrimary">
                Choose which projects stay active
              </h3>
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                projectAtCap
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-subTextColor dark:text-darkTextSecondary",
              )}
            >
              {keepProjects.length} of {preview.max_projects} selected
            </span>
          </div>
          <p className="mb-3 text-sm text-subTextColor dark:text-darkTextSecondary">
            The {preview.target_plan.name} plan includes up to{" "}
            {preview.max_projects} active project(s).
          </p>
          <ul className="max-h-72 overflow-y-auto rounded-lg border border-borderColor dark:border-darkBorder divide-y divide-borderColor dark:divide-darkBorder">
            {preview.active_projects.map((project) => {
              const checked = keepProjects.includes(project.id);
              const disabled = !checked && projectAtCap;
              return (
                <li key={project.id}>
                  <div
                    onClick={() => {
                      if (!disabled) toggleProject(project.id);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                      !disabled &&
                        "cursor-pointer hover:bg-bgSecondary dark:hover:bg-darkSecondaryBg",
                      disabled && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={() => toggleProject(project.id)}
                      aria-label={`Keep ${project.name}`}
                      className="pointer-events-none"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                        {project.name}
                      </span>
                      <span className="block truncate text-xs text-subTextColor dark:text-darkTextSecondary">
                        Deadline: {formatBillingDate(project.deadline)}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-bgSecondary px-2 py-0.5 text-[11px] font-medium capitalize text-subTextColor dark:bg-darkSecondaryBg dark:text-darkTextSecondary">
                      {project.status}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
          {projectAtCap && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Project limit reached — uncheck a project to pick a different one.
            </p>
          )}
        </div>
      )}

      {/* ---------------- review step ---------------- */}
      {step === "review" && (
        <div>
          <h3 className="mb-3 text-base font-medium text-headingTextColor dark:text-darkTextPrimary">
            Review &amp; confirm
          </h3>
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-borderColor p-3 dark:border-darkBorder">
              <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                Members kept
              </p>
              <p className="text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">
                {keepUserIds.length} of {preview.active_users.length}
              </p>
            </div>
            <div className="rounded-lg border border-borderColor p-3 dark:border-darkBorder">
              <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                Projects kept
              </p>
              <p className="text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">
                {keepProjectIds.length} of {preview.active_projects.length}
              </p>
            </div>
          </div>
          <p className="mb-2 text-sm text-headingTextColor dark:text-darkTextPrimary">
            {membersDeactivated} members will be deactivated and{" "}
            {projectsArchived} projects archived.{" "}
            <strong>Nothing is deleted</strong> — all their history stays, and
            upgrading later lets you restore them with one click.
          </p>
          <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
            Parked members can&apos;t sign in; archived projects accept no new
            time but remain in all reports.
          </p>
          {submitError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/15 dark:text-red-300">
              {submitError}
            </p>
          )}
        </div>
      )}

      {/* ---------------- navigation ---------------- */}
      <div className="mt-5 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline2"
          onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          disabled={stepIndex === 0 || submitting}
          className={cn(stepIndex === 0 && "invisible")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {step === "review" ? (
          <Button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={submitting}
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm &amp; continue
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() =>
              setStepIndex((i) => Math.min(steps.length - 1, i + 1))
            }
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
