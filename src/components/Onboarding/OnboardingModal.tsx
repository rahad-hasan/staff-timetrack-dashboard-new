"use client";

import { motion } from "framer-motion";
import {
  BriefcaseBusiness,
  Camera,
  Clock4,
  Sparkles,
  Users,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * Phase 1 — the welcome modal a genuinely new user meets on their first
 * dashboard load. `OnboardingGate` owns when it opens; this file only knows
 * how it looks and which of the three buttons was pressed.
 */

/**
 * Matches the `metadata.title` in `src/app/layout.tsx` minus the trailing
 * "Dashboard" — this is a greeting, not a page title.
 */
const APP_NAME = "Staff Time Tracker";

const FEATURES = [
  {
    icon: Clock4,
    title: "Automatic time tracking",
    body: "The desktop app records hours as your team works — no timers to remember.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Clients and projects",
    body: "Organise work so every hour rolls up to something you can bill or report on.",
  },
  {
    icon: Camera,
    title: "Activity and screenshots",
    body: "See apps, URLs and periodic screenshots alongside the time they belong to.",
  },
  {
    icon: Users,
    title: "Your team, with roles",
    body: "Invite people and decide what each of them can see and change.",
  },
] as const;

interface OnboardingModalProps {
  open: boolean;
  userName?: string;
  /** True when a previous session left a tour part-way through. */
  canResume: boolean;
  onStart: () => void;
  onResume: () => void;
  onSkip: () => void;
}

export default function OnboardingModal({
  open,
  userName,
  canResume,
  onStart,
  onResume,
  onSkip,
}: OnboardingModalProps) {
  const firstName = userName?.trim().split(/\s+/)[0];

  return (
    <Dialog
      open={open}
      // Escape and outside-clicks route through the same handler as "Skip for
      // now" rather than just closing. A modal that can be dismissed without
      // recording the dismissal comes straight back on the next page load.
      onOpenChange={(next) => {
        if (!next) onSkip();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[34rem] p-0 overflow-hidden gap-0"
      >
        <div className="relative px-6 pt-6 pb-5">
          {/* A soft wash of the workspace accent colour, so the very first
              screen already reflects their brand rather than a stock blue. */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-[0.14]"
            style={{
              background:
                "radial-gradient(120% 90% at 15% 0%, var(--primary), transparent 70%)",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="relative"
          >
            <div
              className="inline-flex size-10 items-center justify-center rounded-[10px]"
              style={{ backgroundColor: "color-mix(in srgb, var(--primary) 16%, transparent)" }}
            >
              <Sparkles className="size-5 text-primary" />
            </div>

            <DialogTitle className="mt-3 text-xl sm:text-2xl font-medium text-headingTextColor dark:text-darkTextPrimary">
              {firstName ? `Welcome, ${firstName}. ` : "Welcome! "}
              Let&apos;s build your {APP_NAME} workspace.
            </DialogTitle>

            <DialogDescription className="mt-1.5 text-sm text-subTextColor dark:text-darkTextSecondary">
              Three short steps and your workspace is ready to track real work.
              You can leave at any point and pick up where you stopped.
            </DialogDescription>
          </motion.div>
        </div>

        <div className="grid gap-3 border-t border-borderColor dark:border-darkBorder px-6 py-5 sm:grid-cols-2">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * index + 0.1, duration: 0.25 }}
              className="flex gap-2.5"
            >
              <feature.icon className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                  {feature.title}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-subTextColor dark:text-darkTextSecondary">
                  {feature.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-borderColor dark:border-darkBorder bg-bgSecondary dark:bg-darkSecondaryBg px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="outline2" onClick={onSkip} className="sm:mr-auto">
            Skip for now
          </Button>

          {canResume && (
            <Button variant="outline" onClick={onResume}>
              Resume where I left off
            </Button>
          )}

          <Button onClick={onStart}>Start interactive setup</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
