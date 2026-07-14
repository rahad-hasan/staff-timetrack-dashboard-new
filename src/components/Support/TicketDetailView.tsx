"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  ArrowLeft,
  MessageSquare,
  RotateCcw,
  Star,
  Timer,
  UserCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  TicketAgent,
  TicketConversation,
  TicketDetail,
  TicketFeedback,
  TicketStatus,
} from "@/types/support";
import { useTicketRoomSocket } from "@/hooks/useTicketSocket";
import AttachmentList from "./AttachmentList";
import FeedbackForm from "./FeedbackForm";
import ReplyComposer from "./ReplyComposer";
import StarRating from "./StarRating";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "./TicketBadges";

interface TicketDetailViewProps {
  ticket: TicketDetail;
  currentUser: { id: number; name: string };
}

const sortByCreatedAsc = (a: TicketConversation, b: TicketConversation) =>
  new Date(a.created_at).getTime() - new Date(b.created_at).getTime();

const TicketDetailView = ({ ticket, currentUser }: TicketDetailViewProps) => {
  const router = useRouter();

  const initialConversations = useMemo(
    () =>
      (ticket.conversations ?? [])
        .filter((message) => !message.is_private)
        .sort(sortByCreatedAsc),
    [ticket.conversations],
  );

  const [conversations, setConversations] =
    useState<TicketConversation[]>(initialConversations);
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [assignedAgent, setAssignedAgent] = useState<TicketAgent | null>(
    ticket.assignedAgent,
  );
  const [feedback, setFeedback] = useState<TicketFeedback | null>(
    ticket.feedback,
  );
  const [highlightFeedback, setHighlightFeedback] = useState(false);
  const feedbackRef = useRef<HTMLDivElement | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);
  const sendingIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    setConversations(initialConversations);
    setStatus(ticket.status);
    setAssignedAgent(ticket.assignedAgent);
    setFeedback(ticket.feedback);
  }, [initialConversations, ticket.status, ticket.assignedAgent, ticket.feedback]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversations.length]);

  useEffect(() => {
    if (!highlightFeedback) return;
    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => setHighlightFeedback(false), 2500);
    return () => clearTimeout(timer);
  }, [highlightFeedback]);

  useTicketRoomSocket(ticket.id, {
    onMessage: (event) => {
      if (event.is_private) return;
      setConversations((prev) => {
        if (prev.some((message) => message.id === event.id)) return prev;
        return [
          ...prev,
          {
            id: event.id,
            sender_id: event.sender_id,
            sender_role: event.sender_role,
            message: event.message,
            attachments: event.attachments ?? [],
            created_at: event.created_at,
            sender: event.sender,
          },
        ].sort(sortByCreatedAsc);
      });
    },
    onStatusChanged: (event) => {
      setStatus(event.to);
      toast.info(
        `Status changed: ${STATUS_LABELS[event.from]} → ${STATUS_LABELS[event.to]}`,
      );
      if (event.to === "resolved" && !feedback) {
        setHighlightFeedback(true);
      }
    },
    onAssigned: (event) => {
      setAssignedAgent(event.agent);
    },
    onReconnect: () => {
      router.refresh();
    },
  });

  const appendOptimistic = useCallback(
    (temp: TicketConversation) => {
      sendingIdsRef.current.add(temp.id);
      setConversations((prev) => [...prev, temp]);
      return temp;
    },
    [],
  );

  const reconcileOptimistic = useCallback(
    (tempId: number, reply: TicketConversation | null) => {
      sendingIdsRef.current.delete(tempId);
      setConversations((prev) => {
        if (!reply) {
          return prev.filter((message) => message.id !== tempId);
        }
        const withoutTemp = prev.filter((message) => message.id !== tempId);
        if (withoutTemp.some((message) => message.id === reply.id)) {
          return withoutTemp.sort(sortByCreatedAsc);
        }
        return [...withoutTemp, reply].sort(sortByCreatedAsc);
      });
      if (reply) {
        if (status === "resolved") setStatus("in_progress");
        if (status === "pending_customer") setStatus("in_progress");
      }
    },
    [status],
  );

  const canReply = status !== "closed";
  const canGiveFeedback =
    (status === "resolved" || status === "closed") && !feedback;
  const firstResponseMinutes =
    ticket.first_response_at && ticket.created_at
      ? Math.max(
          0,
          Math.round(
            (parseISO(ticket.first_response_at).getTime() -
              parseISO(ticket.created_at).getTime()) /
              60000,
          ),
        )
      : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3">
        <Button
          asChild
          variant="outline2"
          className="w-fit dark:bg-darkPrimaryBg"
        >
          <Link href="/support/tickets">
            <ArrowLeft className="size-4" />
            Back to tickets
          </Link>
        </Button>

        <div className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-primary">
                  {ticket.display_number}
                </span>
                <TicketStatusBadge status={status} />
                <TicketPriorityBadge priority={ticket.priority} />
                {ticket.reopen_count > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                    <RotateCcw className="size-3" />
                    Reopened {ticket.reopen_count} time
                    {ticket.reopen_count === 1 ? "" : "s"}
                  </span>
                ) : null}
                {firstResponseMinutes !== null ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                    <Timer className="size-3" />
                    First response: {firstResponseMinutes} min
                  </span>
                ) : null}
              </div>

              <h1 className="text-lg font-semibold text-headingTextColor sm:text-2xl dark:text-darkTextPrimary">
                {ticket.title}
              </h1>

              <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                {CATEGORY_LABELS[ticket.category] ?? ticket.category} · Created{" "}
                {formatDistanceToNow(parseISO(ticket.created_at), {
                  addSuffix: true,
                })}{" "}
                ·{" "}
                {assignedAgent ? (
                  <span className="inline-flex items-center gap-1">
                    <UserCircle2 className="size-3.5" />
                    Assigned to {assignedAgent.name}
                  </span>
                ) : (
                  <span className="italic">Not assigned yet</span>
                )}
              </p>

              {ticket.affected_project ? (
                <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                  Affected project: {ticket.affected_project}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section
          aria-label="Conversation"
          className="rounded-[12px] border border-borderColor bg-white dark:border-darkBorder dark:bg-darkSecondaryBg"
        >
          <div className="border-b border-borderColor px-5 py-4 dark:border-darkBorder">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
              <MessageSquare className="size-4 text-primary" />
              Conversation ({conversations.length})
            </h2>
          </div>

          <div
            className="max-h-[560px] space-y-4 overflow-y-auto px-4 py-5 sm:px-5"
            aria-live="polite"
          >
            <MessageBubble
              message={{
                id: 0,
                sender_id: 0,
                sender_role: "user",
                message: ticket.description,
                attachments: [],
                created_at: ticket.created_at,
                sender: { id: 0, name: "You" },
              }}
              currentUserId={currentUser.id}
              isInitial
            />

            {conversations.map((message) => (
              <MessageBubble
                key={`${message.id}-${message.created_at}`}
                message={message}
                currentUserId={currentUser.id}
                pending={sendingIdsRef.current.has(message.id)}
              />
            ))}
            <div ref={threadEndRef} />
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-[12px] border border-borderColor bg-white p-5 dark:border-darkBorder dark:bg-darkSecondaryBg">
            <h2 className="mb-3 text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
              Reply
            </h2>
            {canReply ? (
              <ReplyComposer
                ticketId={ticket.id}
                status={status}
                onOptimisticAppend={appendOptimistic}
                onConfirmed={reconcileOptimistic}
                currentUser={currentUser}
              />
            ) : (
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                This ticket is closed. Create a new ticket if the issue
                returns.
              </div>
            )}
          </div>

          <div
            ref={feedbackRef}
            className={cn(
              "rounded-[12px] border border-borderColor bg-white p-5 transition-shadow dark:border-darkBorder dark:bg-darkSecondaryBg",
              highlightFeedback && "shadow-lg ring-2 ring-primary/30",
            )}
          >
            <h2 className="mb-3 text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
              Feedback
            </h2>

            {feedback ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <StarRating value={feedback.rating} readOnly size={20} />
                  <span className="inline-flex items-center gap-1 text-sm text-amber-500">
                    <Star className="size-3.5 fill-amber-400" />
                    {feedback.rating}/5
                  </span>
                </div>
                {feedback.comment ? (
                  <p className="whitespace-pre-wrap rounded-md bg-bgSecondary/40 p-3 text-sm text-headingTextColor dark:bg-darkPrimaryBg dark:text-darkTextPrimary">
                    {feedback.comment}
                  </p>
                ) : null}
                <p className="text-xs text-subTextColor dark:text-darkTextSecondary">
                  Submitted{" "}
                  {format(parseISO(feedback.created_at), "PPP p")}
                </p>
              </div>
            ) : canGiveFeedback ? (
              <FeedbackForm
                ticketId={ticket.id}
                onSubmitted={(next) => setFeedback(next)}
              />
            ) : (
              <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                You can rate this ticket once it&apos;s resolved or closed.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: TicketConversation;
  currentUserId: number;
  isInitial?: boolean;
  pending?: boolean;
}

const MessageBubble = ({
  message,
  currentUserId,
  isInitial,
  pending,
}: MessageBubbleProps) => {
  // Alignment is based on WHO sent the message (sender_id), not their role.
  // A support agent replying on their own ticket must still see their reply
  // on their own side even though the backend tags it as sender_role="agent".
  const isMine =
    Boolean(isInitial) ||
    (currentUserId > 0 && message.sender_id === currentUserId);
  const isAgent = message.sender_role === "agent";
  const alignmentClass = isMine ? "items-end" : "items-start";
  const bubbleClass = isMine
    ? "bg-primary/10 text-headingTextColor dark:bg-primary/20 dark:text-darkTextPrimary"
    : isAgent
      ? "bg-amber-50 text-headingTextColor dark:bg-amber-900/20 dark:text-darkTextPrimary"
      : "bg-bgSecondary/60 text-headingTextColor dark:bg-darkPrimaryBg dark:text-darkTextPrimary";

  return (
    <div className={cn("flex flex-col gap-1", alignmentClass)}>
      <div className="flex items-center gap-2 text-xs text-subTextColor dark:text-darkTextSecondary">
        <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
          {isMine ? "You" : message.sender?.name || (isAgent ? "Support" : "User")}
        </span>
        {isAgent ? (
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
            Support
          </span>
        ) : null}
        <span>
          {formatDistanceToNow(parseISO(message.created_at), { addSuffix: true })}
        </span>
        {pending ? <span className="italic">sending…</span> : null}
      </div>
      <div
        className={cn(
          "max-w-[90%] break-words whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm shadow-sm",
          bubbleClass,
        )}
      >
        {message.message}
        <AttachmentList urls={message.attachments} />
      </div>
    </div>
  );
};

export default TicketDetailView;
