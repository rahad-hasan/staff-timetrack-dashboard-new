"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import {
  MessageSquare,
  Plus,
  RefreshCw,
  Star,
  Ticket as TicketIcon,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";
import AppPagination from "@/components/Common/AppPagination";
import HeadingComponent from "@/components/Common/HeadingComponent";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IMeta } from "@/types/type";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  TicketListItem,
} from "@/types/support";
import { useTicketGlobalSocket } from "@/hooks/useTicketSocket";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "./TicketBadges";
import TicketFilters from "./TicketFilters";

interface TicketListViewProps {
  tickets: TicketListItem[];
  meta: IMeta | null | undefined;
  status?: string;
  category?: string;
  page: number;
  limit: number;
}

const truncate = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

const TicketListView = ({
  tickets,
  meta,
  status,
  category,
  page,
  limit,
}: TicketListViewProps) => {
  const router = useRouter();
  const [search, setSearch] = useState("");

  useTicketGlobalSocket({
    onMessage: (event) => {
      const label = event.display_number
        ? `Ticket ${event.display_number}`
        : "a ticket";
      toast.info(`New reply on ${label}`, {
        action: event.ticket_id
          ? {
              label: "Open",
              onClick: () => router.push(`/support/tickets/${event.ticket_id}`),
            }
          : undefined,
      });
      router.refresh();
    },
    onStatusChanged: () => {
      router.refresh();
    },
  });

  const normalizedSearch = search.trim().toLowerCase();
  const filteredTickets = useMemo(() => {
    if (!normalizedSearch) return tickets;
    return tickets.filter((ticket) => {
      const haystack =
        `${ticket.title} ${ticket.display_number} ${ticket.ticket_number}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [normalizedSearch, tickets]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <HeadingComponent
          heading="My Support Tickets"
          subHeading="Track your open support conversations and follow up with the team."
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline2"
            onClick={() => router.refresh()}
            className="dark:bg-darkPrimaryBg"
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/support/tickets/new">
              <Plus className="size-4" />
              Create ticket
            </Link>
          </Button>
        </div>
      </div>

      <TicketFilters
        status={status}
        category={category}
        search={search}
        onSearchChange={setSearch}
      />

      <div className="overflow-hidden rounded-lg border border-borderColor bg-white dark:border-darkBorder dark:bg-darkSecondaryBg">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <TicketIcon className="size-8" />
            </div>
            <div>
              <p className="text-lg font-semibold text-headingTextColor dark:text-darkTextPrimary">
                You haven&apos;t created any tickets yet
              </p>
              <p className="mt-1 text-sm text-subTextColor dark:text-darkTextSecondary">
                Reach out when something breaks or you need a hand — we&apos;re
                here.
              </p>
            </div>
            <Button asChild>
              <Link href="/support/tickets/new">
                <Plus className="size-4" />
                Create your first ticket
              </Link>
            </Button>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="px-6 py-14 text-center text-sm text-subTextColor dark:text-darkTextSecondary">
            No tickets match your search.
          </div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-darkBorder">
                    <TableHead className="w-[130px]">Ticket</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="w-[160px]">Category</TableHead>
                    <TableHead className="w-[110px]">Priority</TableHead>
                    <TableHead className="w-[130px]">Status</TableHead>
                    <TableHead className="w-[180px]">Assigned</TableHead>
                    <TableHead className="w-[90px] text-center">
                      Replies
                    </TableHead>
                    <TableHead className="w-[100px]">Rating</TableHead>
                    <TableHead className="w-[140px]">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow
                      key={ticket.id}
                      onClick={() =>
                        router.push(`/support/tickets/${ticket.id}`)
                      }
                      className="cursor-pointer transition-colors last:[&>td]:!pb-4 hover:bg-bgSecondary/60 dark:border-darkBorder dark:hover:bg-darkPrimaryBg/70"
                    >
                      <TableCell className="font-medium text-primary">
                        {ticket.display_number}
                      </TableCell>
                      <TableCell className="text-headingTextColor dark:text-darkTextPrimary">
                        {truncate(ticket.title, 60)}
                      </TableCell>
                      <TableCell className="text-sm text-subTextColor dark:text-darkTextSecondary">
                        {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                      </TableCell>
                      <TableCell>
                        <TicketPriorityBadge priority={ticket.priority} />
                      </TableCell>
                      <TableCell>
                        <TicketStatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell className="text-sm text-subTextColor dark:text-darkTextSecondary">
                        {ticket.assignedAgent ? (
                          <span className="inline-flex items-center gap-1.5">
                            <UserCircle2 className="size-4 text-primary" />
                            {ticket.assignedAgent.name}
                          </span>
                        ) : (
                          <span className="italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center gap-1 text-sm text-subTextColor dark:text-darkTextSecondary">
                          <MessageSquare className="size-3.5" />
                          {ticket._count?.conversations ?? 0}
                        </span>
                      </TableCell>
                      <TableCell>
                        {ticket.feedback ? (
                          <span className="inline-flex items-center gap-1 text-sm text-amber-500">
                            <Star className="size-3.5 fill-amber-400" />
                            {ticket.feedback.rating}
                          </span>
                        ) : (
                          <span className="text-xs text-subTextColor dark:text-darkTextSecondary">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-subTextColor dark:text-darkTextSecondary">
                        {formatDistanceToNow(parseISO(ticket.created_at), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <ul className="divide-y divide-borderColor md:hidden dark:divide-darkBorder">
              {filteredTickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link
                    href={`/support/tickets/${ticket.id}`}
                    className="block px-4 py-4 transition-colors hover:bg-bgSecondary/50 dark:hover:bg-darkPrimaryBg"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-primary">
                          {ticket.display_number}
                        </p>
                        <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
                          {truncate(ticket.title, 60)}
                        </p>
                        <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                          {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                          {" · "}
                          {formatDistanceToNow(parseISO(ticket.created_at), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                      <TicketStatusBadge status={ticket.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-subTextColor dark:text-darkTextSecondary">
                      <TicketPriorityBadge priority={ticket.priority} />
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="size-3.5" />
                        {ticket._count?.conversations ?? 0}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <UserCircle2 className="size-3.5" />
                        {ticket.assignedAgent?.name ?? "Unassigned"}
                      </span>
                      {ticket.feedback ? (
                        <span className="inline-flex items-center gap-1 text-amber-500">
                          <Star className="size-3.5 fill-amber-400" />
                          {ticket.feedback.rating}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <span className="sr-only" aria-live="polite" role="status">
        {STATUS_LABELS[status as keyof typeof STATUS_LABELS] ?? "All"} tickets
        loaded.
      </span>

      {meta && meta.total > limit ? (
        <AppPagination total={meta.total} currentPage={page} limit={limit} />
      ) : null}
    </div>
  );
};

export default TicketListView;
