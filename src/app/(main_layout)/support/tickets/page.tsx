import { Metadata } from "next";
import { getTickets } from "@/actions/support/action";
import TicketListView from "@/components/Support/TicketListView";
import {
  ISearchParamsProps,
  IResponse,
} from "@/types/type";
import {
  TicketCategory,
  TicketListItem,
  TicketStatus,
  TICKET_CATEGORY_VALUES,
  TICKET_STATUS_VALUES,
} from "@/types/support";

export const metadata: Metadata = {
  title: "Support Tickets",
  description: "Track your submitted support tickets and follow up with the team.",
};

const DEFAULT_LIMIT = 20;

const isStatus = (value: unknown): value is TicketStatus =>
  typeof value === "string" &&
  (TICKET_STATUS_VALUES as string[]).includes(value);

const isCategory = (value: unknown): value is TicketCategory =>
  typeof value === "string" &&
  (TICKET_CATEGORY_VALUES as string[]).includes(value);

const SupportTicketsPage = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;

  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.max(1, Number(params.limit) || DEFAULT_LIMIT);
  const status = isStatus(params.status) ? params.status : undefined;
  const category = isCategory(params.category) ? params.category : undefined;

  const response: IResponse<TicketListItem[]> = await getTickets({
    page,
    limit,
    status,
    category,
  });

  const tickets = response?.success && Array.isArray(response.data)
    ? response.data
    : [];

  return (
    <TicketListView
      tickets={tickets}
      meta={response?.meta}
      status={status}
      category={category}
      page={page}
      limit={limit}
    />
  );
};

export default SupportTicketsPage;
