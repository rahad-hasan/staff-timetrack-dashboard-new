"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Rocket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IOnboardingTask, OnboardingTaskId } from "@/types/onboarding";

/**
 * The sticky "Getting started" widget.
 *
 * It is a *mirror*, never a source of truth: every tick here is a milestone
 * the user really earned by creating the thing, reported by that flow's own
 * success handler. Nothing in this component can mark a task complete, which
 * is what keeps it honest when someone skips the tour entirely and just gets
 * on with setting the workspace up.
 *
 * Sits below the tour overlay (`z-[80]` against the spotlight's `z-[9990]`) so
 * a running tour dims it along with everything else instead of leaving it
 * floating brightly over the backdrop.
 */

interface ChecklistWidgetProps {
  tasks: IOnboardingTask[];
  completed: OnboardingTaskId[];
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onDismiss: () => void;
  /** The TOUR_COMPLETED row runs the walkthrough instead of navigating. */
  onStartTour: () => void;
}

export default function ChecklistWidget({
  tasks,
  completed,
  expanded,
  onExpandedChange,
  onDismiss,
  onStartTour,
}: ChecklistWidgetProps) {
  const done = tasks.filter((task) => completed.includes(task.id)).length;
  const total = tasks.length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      className="fixed bottom-4 right-4 z-[80] w-[min(21rem,calc(100vw-2rem))]"
    >
      <div className="overflow-hidden rounded-[12px] border border-borderColor dark:border-darkBorder bg-bgPrimary dark:bg-darkPrimaryBg shadow-[0_16px_40px_-12px_rgba(6,10,20,0.35)]">
        {/* ── header: doubles as the collapse toggle ── */}
        <div className="flex items-center gap-2 px-3.5 py-3">
          <button
            type="button"
            onClick={() => onExpandedChange(!expanded)}
            aria-expanded={expanded}
            className="flex min-w-0 flex-1 items-center gap-2.5 text-left cursor-pointer"
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-[8px]"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--primary) 14%, transparent)",
              }}
            >
              <Rocket className="size-4 text-primary" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                Getting started
              </span>
              <span className="block text-xs text-subTextColor dark:text-darkTextSecondary">
                {done} of {total} tasks completed
              </span>
            </span>

            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-subTextColor transition-transform duration-200",
                expanded ? "rotate-0" : "-rotate-90",
              )}
            />
          </button>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss getting started checklist"
            className="rounded p-1 text-subTextColor hover:bg-gray-100 dark:text-darkTextSecondary dark:hover:bg-darkSecondaryBg cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* ── progress bar: always visible, collapsed or not ── */}
        <div className="px-3.5 pb-3">
          <div
            className="h-1.5 w-full overflow-hidden rounded-full bg-bgSecondary dark:bg-darkSecondaryBg"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Workspace setup progress"
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: "var(--primary)" }}
              initial={false}
              animate={{ width: `${percent}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 28 }}
            />
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="tasks"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <ul className="border-t border-borderColor dark:border-darkBorder">
                {tasks.map((task) => {
                  const isDone = completed.includes(task.id);
                  const isTourTask = task.id === "TOUR_COMPLETED";

                  return (
                    <li
                      key={task.id}
                      className="flex items-center gap-2.5 border-b border-borderColor/60 px-3.5 py-2.5 last:border-b-0 dark:border-darkBorder/60"
                    >
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                          isDone
                            ? "border-transparent"
                            : "border-borderColor dark:border-darkBorder",
                        )}
                        style={
                          isDone
                            ? { backgroundColor: "var(--primary)" }
                            : undefined
                        }
                      >
                        {isDone && (
                          <Check className="size-3 text-white" strokeWidth={3} />
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm",
                            isDone
                              ? "text-subTextColor line-through dark:text-darkTextSecondary"
                              : "text-headingTextColor dark:text-darkTextPrimary",
                          )}
                        >
                          {task.label}
                        </span>
                        {!isDone && (
                          <span className="block truncate text-xs text-subTextColor dark:text-darkTextSecondary">
                            {task.description}
                          </span>
                        )}
                      </span>

                      {!isDone &&
                        (isTourTask ? (
                          <Button size="sm" variant="outline" onClick={onStartTour}>
                            {task.ctaLabel}
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" asChild>
                            <Link href={task.href}>{task.ctaLabel}</Link>
                          </Button>
                        ))}
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
