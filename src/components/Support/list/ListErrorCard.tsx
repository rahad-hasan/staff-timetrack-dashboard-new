"use client";

import { CircleAlert, RefreshCw } from "lucide-react";
import { SupportButton } from "@/components/Support/primitives";
import { TicketCardFrame } from "./TicketTable";

interface ListErrorCardProps {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
  /** seconds a Retry-After still holds the button (0 = free) */
  waitSeconds?: number;
}

/**
 * The list read failed (plan §5: "We couldn't load your tickets" + Retry).
 * Same white card as the table so the page keeps its shape; the filters
 * stay as they were, Retry repeats exactly that read. While it reads the
 * button is busy (`aria-busy` + `aria-disabled`, SupportButton `loading`) and
 * keeps focus; the page moves focus to the table once rows land.
 * `waitSeconds` (a 429's Retry-After) holds the button — focusable, announced
 * as unavailable, ignored when pressed — and counts down on it.
 */
export const ListErrorCard = ({ message, onRetry, retrying = false, waitSeconds = 0 }: ListErrorCardProps) => (
  <TicketCardFrame className="flex flex-col items-center px-6 pb-14 pt-12 text-center">
    <div role="alert" className="flex flex-col items-center">
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-[#fef2f2] text-[#c10007] dark:bg-[#fb2c36]/15 dark:text-[#ffa2a2]"
      >
        <CircleAlert size={22} strokeWidth={2} />
      </span>
      <h2 className="mt-4 text-[18px] font-medium leading-7 text-headingTextColor dark:text-darkTextPrimary">
        We couldn&apos;t load your tickets
      </h2>
      <p className="mt-1 max-w-[420px] text-[14px] leading-[22px] text-subTextColor dark:text-darkTextSecondary">
        {message}
      </p>
    </div>
    <SupportButton
      variant="outline"
      icon={<RefreshCw strokeWidth={2} />}
      loading={retrying}
      blocked={waitSeconds > 0}
      onClick={onRetry}
      data-support-list-retry
      className="mt-5"
    >
      {waitSeconds > 0 ? `Try again in ${waitSeconds}s` : "Try again"}
    </SupportButton>
  </TicketCardFrame>
);

export default ListErrorCard;
