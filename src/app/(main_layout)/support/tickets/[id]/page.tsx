import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTicketById } from "@/actions/support/action";
import TicketPageView from "@/components/Support/ticket/TicketPageView";

interface TicketPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title: "Support Ticket",
  description: "Follow the conversation with the support team, reply and rate the help you received.",
};

/** Ticket ids are positive Postgres integers; anything else is a 404 before any request. */
const ID_PATTERN = /^[1-9]\d{0,9}$/;
const MAX_ID = 2_147_483_647;

/**
 * `/support/tickets/[id]` — one server read (`GET /tickets/:id`, the latest
 * thread page, narrowed by the action), then the client page takes over.
 * A foreign or unknown id is the API's 404 → `not-found.tsx` (the API never
 * tells the two apart); any other failure throws to `error.tsx` (Retry).
 *
 * `?action=feedback` is the "Rate your agent" link of the feedback request and
 * reminder mails and of the Resolved notification (backend
 * worker/notify/mail.ts `requesterFeedbackUrl`): the page opens the rating
 * popup at once, or says why it can't.
 */
const TicketPage = async ({ params, searchParams }: TicketPageProps) => {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const action = Array.isArray(query.action) ? query.action[0] : query.action;
  if (!ID_PATTERN.test(id) || Number(id) > MAX_ID) notFound();

  const response = await getTicketById(Number(id));
  if (!response?.success || !response.data) {
    if (response?.statusCode === 404) notFound();
    throw new Error(response?.message || "We couldn't load this ticket.");
  }

  return (
    <TicketPageView
      key={response.data.id}
      initial={response.data}
      renderedAt={Date.now()}
      intent={action === "feedback" ? "feedback" : null}
    />
  );
};

export default TicketPage;
