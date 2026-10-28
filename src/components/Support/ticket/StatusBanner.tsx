"use client";

import { memo } from "react";
import { CircleCheck, Lock, MessageCircleQuestion, SquarePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORT_TONE_CLASS, SupportButton } from "@/components/Support/primitives";
import type { TicketClosedReason, TicketStatus } from "@/types/support";

interface StatusBannerProps {
  status: TicketStatus;
  agentFirstName: string | null;
  closedReason: TicketClosedReason | null;
  onOpenNew: () => void;
  openingNew: boolean;
}

/**
 * The state line above the composer, as TD-06 draws its "Resolved — a reply
 * from the requester reopens it…" banner (measured at 2×): 44px tall, 10px
 * radius, 14px inset, 18px glyph, 10px gap, one plain 14/22 sentence in
 * #0f1613 (the state word is not emphasised). Resolved uses TD-06's greens;
 * Waiting on you the violet of its pill; Closed (read-only) grey with
 * "Open a new ticket". Other statuses draw nothing.
 */
export const StatusBanner = memo(function StatusBanner({
  status,
  agentFirstName,
  closedReason,
  onOpenNew,
  openingNew,
}: StatusBannerProps) {
  if (status === "pending_customer") {
    return (
      <div
        data-banner="waiting"
        className={cn("flex items-start gap-2.5 rounded-[10px] border px-3.5 py-2.5", SUPPORT_TONE_CLASS.waiting)}
      >
        <MessageCircleQuestion aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-[#7008e7] dark:text-[#c4b4ff]" />
        <p className="text-[14px] leading-[22px] text-headingTextColor dark:text-darkTextPrimary">
          Waiting on you — {agentFirstName ?? "our team"} needs a bit more information. Reply below and your ticket goes
          straight back to the team.
        </p>
      </div>
    );
  }
  if (status === "resolved") {
    return (
      <div
        data-banner="resolved"
        className={cn("flex items-start gap-2.5 rounded-[10px] border px-3.5 py-2.5", SUPPORT_TONE_CLASS.success)}
      >
        <CircleCheck aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-[#0d9f2d] dark:text-[#7bf1a8]" />
        <p className="text-[14px] leading-[22px] text-headingTextColor dark:text-darkTextPrimary">
          Resolved — if something&apos;s still not right, reply below and our team will pick it back up.
        </p>
      </div>
    );
  }
  if (status === "closed") {
    return (
      <div
        data-banner="closed"
        className={cn(
          "flex flex-col gap-3 rounded-[10px] border px-3.5 py-2.5 sm:flex-row sm:items-center sm:py-2 sm:pr-2",
          SUPPORT_TONE_CLASS.neutral,
        )}
      >
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <Lock aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-[#364153] dark:text-[#d1d5dc]" />
          <p className="text-[14px] leading-[22px] text-headingTextColor dark:text-darkTextPrimary">
            This ticket is closed
            {closedReason === "auto_close" ? " automatically after a period without replies" : ""} — the conversation is
            read-only. Still need help? Open a new ticket and we&apos;ll link it to this one.
          </p>
        </div>
        <SupportButton variant="outline" size="md" icon={<SquarePlus />} onClick={onOpenNew} loading={openingNew} className="self-start sm:self-auto">
          Open a new ticket
        </SupportButton>
      </div>
    );
  }
  return null;
});

export default StatusBanner;
