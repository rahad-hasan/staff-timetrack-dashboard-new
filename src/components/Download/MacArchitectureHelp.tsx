"use client";

import type { RefObject } from "react";
import { ChevronDown, Cpu, HelpCircle } from "lucide-react";

import { cn } from "@/lib/utils";

const STEPS: { chip: string; label: string; detail: string }[] = [
  {
    chip: "Apple M Series",
    label: "Apple Silicon",
    detail: "Download the Apple Silicon build for full native performance.",
  },
  {
    chip: "Intel Core i5 / i7 / i9",
    label: "Intel",
    detail: "Download the Intel build — the Apple Silicon one will not open.",
  },
];

interface IMacArchitectureHelpProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** Owned by the page so a remote trigger can `aria-controls` this panel. */
  panelId: string;
  /** Lets the page move focus here after opening the panel from elsewhere. */
  triggerRef?: RefObject<HTMLButtonElement | null>;
}

/**
 * Inline disclosure that helps a user tell an Apple Silicon Mac from an Intel
 * one. Kept as an accordion rather than a modal so it can sit directly under
 * the platform matrix without stealing focus from the download itself.
 *
 * Controlled by the page so the "Which one do I have?" prompt in the
 * recommended card can open it and scroll to it.
 */
const MacArchitectureHelp = ({
  isOpen,
  onOpenChange,
  panelId,
  triggerRef,
}: IMacArchitectureHelpProps) => {
  return (
    <div className="overflow-hidden rounded-[12px] border border-borderColor bg-bgSecondary/40 dark:border-darkBorder dark:bg-darkPrimaryBg/40">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className={cn(
          "flex w-full cursor-pointer items-center gap-2.5 px-4 py-3 text-left transition",
          "hover:bg-bgSecondary/60 dark:hover:bg-darkSecondaryBg/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          isOpen && "bg-bgSecondary/60 dark:bg-darkSecondaryBg/40",
        )}
      >
        <HelpCircle aria-hidden className="size-4 shrink-0 text-primary" />
        <span className="flex-1 text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
          Which Mac architecture do I have?
        </span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-subTextColor transition-transform dark:text-darkTextSecondary",
            isOpen && "rotate-180 text-primary",
          )}
        />
      </button>

      <div
        id={panelId}
        role="region"
        aria-label="Which Mac architecture do I have?"
        hidden={!isOpen}
        className="border-t border-borderColor px-4 py-4 dark:border-darkBorder"
      >
        <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
          Open the{" "}
          <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
            Apple menu
          </span>{" "}
          in the top-left corner, choose{" "}
          <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
            About This Mac
          </span>
          , and read the first line:
        </p>

        <ul className="mt-3 space-y-2">
          {STEPS.map((step) => (
            <li
              key={step.label}
              className="flex flex-col gap-1.5 rounded-lg border border-borderColor bg-white px-3 py-2.5 dark:border-darkBorder dark:bg-darkPrimaryBg sm:flex-row sm:items-center sm:gap-3"
            >
              <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 font-mono text-xs font-medium text-primary">
                <Cpu aria-hidden className="size-3" />
                {step.chip}
              </span>
              <span className="text-sm text-subTextColor dark:text-darkTextSecondary">
                <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                  {step.label}
                </span>{" "}
                — {step.detail}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-xs text-subTextColor dark:text-darkTextSecondary">
          Every Mac released from late 2020 onwards uses Apple Silicon. If you
          are still unsure, the Intel build runs on both — Apple Silicon Macs
          will just run it through Rosetta 2 instead of natively.
        </p>
      </div>
    </div>
  );
};

export default MacArchitectureHelp;
