"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TicketFeedback, TicketStatus } from "@/types/support";
import FeedbackForm, { FeedbackRejection } from "./FeedbackForm";

interface FeedbackDialogProps {
  ticketId: number;
  displayNumber: string;
  status: TicketStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted: (feedback: TicketFeedback) => void;
  onRejected?: (code: FeedbackRejection) => void;
}

/**
 * The rating prompt shown when a ticket is resolved. The form mounts only
 * while open, so every appearance starts from a clean state; "Maybe later",
 * the X and Escape all go through onOpenChange(false) so the caller can
 * remember the dismissal. Clicks outside are ignored on purpose: the status
 * toast that announces the resolution sits outside the dialog, and tapping it
 * must not count as "maybe later". While a submit is in flight the dialog
 * cannot be closed at all.
 */
const FeedbackDialog = ({
  ticketId,
  displayNumber,
  status,
  open,
  onOpenChange,
  onSubmitted,
  onRejected,
}: FeedbackDialogProps) => {
  const resolved = status === "resolved";
  const [saving, setSaving] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (!next && saving) return;
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-md dark:bg-darkSecondaryBg"
        showCloseButton={!saving}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => {
          if (saving) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-headingTextColor dark:text-darkTextPrimary">
            {resolved ? "Your ticket is resolved" : "Rate your support experience"}
          </DialogTitle>
          <DialogDescription className="text-subTextColor dark:text-darkTextSecondary">
            {resolved
              ? `${displayNumber} has been marked as resolved. How did we do? Your rating helps us improve support.`
              : `How did we do on ${displayNumber}? Your rating helps us improve support.`}
          </DialogDescription>
        </DialogHeader>

        <FeedbackForm
          ticketId={ticketId}
          hideIntro
          onSubmitted={onSubmitted}
          onRejected={onRejected}
          onSavingChange={setSaving}
          onCancel={() => onOpenChange(false)}
          cancelLabel="Maybe later"
        />
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackDialog;
