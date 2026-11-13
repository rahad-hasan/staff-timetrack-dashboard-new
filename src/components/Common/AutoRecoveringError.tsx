"use client";

import { Loader2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useErrorAutoRecovery } from "@/hooks/useErrorAutoRecovery";
import { cn } from "@/lib/utils";

/**
 * The error fallback for pages that refresh themselves in the background
 * (dashboard panels, timesheets, activity). A failed background read must not
 * latch the page on an error until someone clicks: this heals itself once the
 * server answers again (see useErrorAutoRecovery), and "Try again" does it now.
 */
export default function AutoRecoveringError({
  reset,
  compact = false,
  title,
  className,
}: {
  reset: () => void;
  /** Sized for a panel or a dialog's content instead of a page: no page-height block. */
  compact?: boolean;
  /**
   * The heading of the dashboard panel this replaces. The message is drawn
   * compact, inside that panel's frame, so the grid keeps its shape and the
   * reader can tell which panel failed.
   */
  title?: string;
  /** Classes for the outermost element, such as the replaced panel's margins. */
  className?: string;
}) {
  const { retry, retrying } = useErrorAutoRecovery(reset);
  const small = compact || title !== undefined;
  const Heading = small ? "p" : "h2";

  const message = (
    <div
      className={cn(
        small
          ? "flex flex-1 flex-col items-center justify-center py-8 text-center"
          : "flex flex-col items-center justify-center h-[60vh] text-center",
        title === undefined && className,
      )}
    >
      <Heading className={small ? "font-medium mb-1" : "text-xl font-semibold mb-2"}>
        {"Something Went Wrong"}
      </Heading>

      <p className="text-sm text-gray-500 dark:text-darkTextSecondary mb-4">
        Retrying automatically. You can also try again now.
      </p>

      {/* aria-busy + guard instead of disabled: disabling the focused button
          mid-retry would drop keyboard focus to <body>. */}
      <Button variant="outline2" onClick={retry} aria-busy={retrying}>
        {retrying ? <Loader2 className="animate-spin" /> : <RotateCw />}
        Try again
      </Button>
    </div>
  );

  if (title === undefined) return message;

  return (
    <section
      className={cn(
        "flex flex-col w-full h-full border border-borderColor/60 dark:border-darkBorder/50 dark:bg-darkPrimaryBg p-4 2xl:p-5 rounded-[12px]",
        className,
      )}
    >
      <h2 className="text-base sm:text-lg uppercase text-headingTextColor dark:text-darkTextPrimary">
        {title}
      </h2>
      {message}
    </section>
  );
}
