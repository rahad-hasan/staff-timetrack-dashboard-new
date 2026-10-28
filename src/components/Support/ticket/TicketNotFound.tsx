import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { EmptyState, SupportButton } from "@/components/Support/primitives";
import { SUPPORT_NEW_TICKET_PATH, SUPPORT_TICKETS_PATH } from "@/lib/support";

interface TicketNotFoundProps {
  /** "missing" = the id never was the viewer's (404 on load); "gone" = it disappeared while open */
  reason?: "missing" | "gone";
}

/**
 * 404 for a foreign or unknown ticket id (the API answers the same 404 for
 * both — anti-enumeration, §17.2 item 2), in the user-portal empty-state
 * language: the not-found illustration, 22/500 heading, 15/23 body, Back +
 * Create ticket.
 */
export const TicketNotFound = ({ reason = "missing" }: TicketNotFoundProps) => (
  <EmptyState
    variant="no-results"
    headingLevel="h2"
    title={reason === "gone" ? "This ticket is no longer available" : "We couldn't find that ticket"}
    description={
      reason === "gone"
        ? "It may have been removed while you were viewing it. Your other tickets are still in My Support Tickets."
        : "It may have been removed, or the link points to a ticket that isn't yours. Check the ticket number or go back to your tickets."
    }
    actions={
      <>
        <SupportButton asChild variant="outline" size="md" icon={<ArrowLeft />}>
          <Link href={SUPPORT_TICKETS_PATH}>My Support Tickets</Link>
        </SupportButton>
        <SupportButton asChild variant="primary" size="md" icon={<Plus />}>
          <Link href={SUPPORT_NEW_TICKET_PATH}>Create ticket</Link>
        </SupportButton>
      </>
    }
  />
);

export default TicketNotFound;
