"use client";

import { KeyboardEvent, useRef, useState } from "react";
import { AlertTriangle, Send } from "lucide-react";
import { toast } from "sonner";
import { postTicketReply } from "@/actions/support/action";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { hasErrorCode } from "@/lib/support";
import {
  CreateReplyPayload,
  TicketConversation,
  TicketStatus,
} from "@/types/support";
import AttachmentUrlInput from "./AttachmentUrlInput";

const MAX_LENGTH = 5000;

interface ReplyComposerProps {
  ticketId: number;
  status: TicketStatus;
  onOptimisticAppend: (temp: TicketConversation) => TicketConversation;
  onConfirmed: (
    tempId: number,
    reply: TicketConversation | null,
  ) => void;
  currentUser: { id: number; name: string };
}

const ReplyComposer = ({
  ticketId,
  status,
  onOptimisticAppend,
  onConfirmed,
  currentUser,
}: ReplyComposerProps) => {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isResolved = status === "resolved";
  const trimmed = message.trim();
  const canSend = trimmed.length > 0 && !sending;

  const doSend = async () => {
    if (!canSend) return;
    setSending(true);

    const payload: CreateReplyPayload = { message: trimmed };
    if (attachments.length > 0) payload.attachments = attachments;

    const optimistic: TicketConversation = onOptimisticAppend({
      id: -Date.now(),
      sender_id: currentUser.id,
      sender_role: "user",
      message: trimmed,
      attachments,
      created_at: new Date().toISOString(),
      sender: currentUser,
    });

    const response = await postTicketReply(ticketId, payload);

    if (response?.success && response.data) {
      onConfirmed(optimistic.id, response.data);
      setMessage("");
      setAttachments([]);
      requestAnimationFrame(() => textareaRef.current?.focus());
    } else {
      onConfirmed(optimistic.id, null);
      if (hasErrorCode(response, "TICKET_CLOSED")) {
        toast.error("This ticket is closed. Open a new ticket.");
      } else {
        toast.error(response?.message || "Failed to send reply");
      }
    }
    setSending(false);
  };

  const handleSendClick = () => {
    if (!canSend) return;
    if (!isResolved) {
      void doSend();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      (event.metaKey || event.ctrlKey) &&
      event.key === "Enter" &&
      canSend &&
      !isResolved
    ) {
      event.preventDefault();
      void doSend();
    }
  };

  return (
    <div className="space-y-3">
      {isResolved ? (
        <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>Replying will reopen this ticket.</p>
        </div>
      ) : null}

      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={MAX_LENGTH}
        rows={4}
        placeholder="Write your reply…"
        className="min-h-[110px] dark:border-darkBorder dark:bg-darkPrimaryBg"
        aria-label="Reply to ticket"
        disabled={sending}
      />

      <AttachmentUrlInput
        value={attachments}
        onChange={setAttachments}
        disabled={sending}
      />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-subTextColor dark:text-darkTextSecondary">
          {trimmed.length}/{MAX_LENGTH} · Cmd/Ctrl + Enter to send
        </span>

        {isResolved ? (
          <ConfirmDialog
            trigger={
              <Button type="button" disabled={!canSend}>
                <Send className="size-4" />
                {sending ? "Sending…" : "Send reply"}
              </Button>
            }
            title="Reopen this ticket?"
            description="This ticket is resolved. Replying will reopen it and set its status back to in progress."
            confirmText="Yes, reply anyway"
            cancelText="Cancel"
            confirmClassName="bg-primary text-primary-foreground hover:bg-primary/90"
            onConfirm={doSend}
          />
        ) : (
          <Button
            type="button"
            onClick={handleSendClick}
            disabled={!canSend}
          >
            <Send className="size-4" />
            {sending ? "Sending…" : "Send reply"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReplyComposer;
