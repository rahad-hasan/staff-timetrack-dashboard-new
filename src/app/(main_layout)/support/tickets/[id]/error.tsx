"use client";

import Link from "next/link";
import { ArrowLeft, RotateCw } from "lucide-react";
import { EmptyState, SupportButton } from "@/components/Support/primitives";
import { useBoundaryRetry } from "@/components/Support/primitives/useBoundaryRetry";
import { SUPPORT_TICKETS_PATH } from "@/lib/support";

/**
 * Error boundary of the ticket page: the server read failed (API down,
 * malformed payload) or a render threw. "Try again" follows
 * `useBoundaryRetry` (reload after a server-render failure, a transition
 * re-render otherwise).
 */
export default function TicketPageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { retry, busy } = useBoundaryRetry(error, reset, "ticket page");

  return (
    <EmptyState
      variant="no-results"
      headingLevel="h2"
      title="We couldn't load this ticket"
      description="Something went wrong on our side or the connection dropped. Your ticket and its messages are safe — try again in a moment."
      actions={
        <>
          <SupportButton asChild variant="outline" size="md" icon={<ArrowLeft />}>
            <Link href={SUPPORT_TICKETS_PATH}>My Support Tickets</Link>
          </SupportButton>
          <SupportButton variant="primary" size="md" icon={<RotateCw />} loading={busy} onClick={retry}>
            Try again
          </SupportButton>
        </>
      }
    />
  );
}
