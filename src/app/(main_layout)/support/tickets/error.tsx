"use client";

import { CircleAlert, RefreshCw } from "lucide-react";
import { SupportButton } from "@/components/Support/primitives";
import { useBoundaryRetry } from "@/components/Support/primitives/useBoundaryRetry";

interface SupportTicketsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error boundary of /support/tickets (and of `/support/tickets/new`, which
 * has none of its own): the list's own failures render inline cards, so this
 * catches a failed server render or an unexpected render error. "Try again"
 * follows `useBoundaryRetry` (reload after a server-render failure, a
 * transition re-render otherwise). The page's h1 is gone with the failed
 * segment, so this card carries one.
 */
export default function SupportTicketsError({ error, reset }: SupportTicketsErrorProps) {
  const { retry, busy } = useBoundaryRetry(error, reset, "tickets page");

  return (
    <div className="flex w-full flex-col items-center rounded-2xl border border-borderColor bg-white px-6 py-16 text-center dark:border-darkBorder dark:bg-darkSecondaryBg">
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-[#fef2f2] text-[#c10007] dark:bg-[#fb2c36]/15 dark:text-[#ffa2a2]"
      >
        <CircleAlert size={22} strokeWidth={2} />
      </span>
      <h1 className="mt-4 text-[22px] font-medium leading-[34px] text-headingTextColor dark:text-darkTextPrimary">
        We couldn&apos;t load your support tickets
      </h1>
      <p className="mt-1 max-w-[420px] text-[15px] leading-[23px] text-subTextColor dark:text-darkTextSecondary">
        Something went wrong on our side. Try again — your tickets are safe.
      </p>
      <SupportButton
        className="mt-6"
        icon={<RefreshCw strokeWidth={2} />}
        loading={busy}
        onClick={retry}
      >
        Try again
      </SupportButton>
    </div>
  );
}
