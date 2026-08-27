"use client";

import { Compass } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * The bridge between Phase 2 and Phase 4.
 *
 * Finishing the core setup walkthrough does not roll straight into six more
 * steps — it asks. A tour the user opted into twice is a tour; one that keeps
 * going after the job is done is an obstacle.
 */
interface TourHandoffDialogProps {
  open: boolean;
  stepCount: number;
  onAccept: () => void;
  onDecline: () => void;
}

export default function TourHandoffDialog({
  open,
  stepCount,
  onAccept,
  onDecline,
}: TourHandoffDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onDecline();
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-[26rem]">
        <div
          className="inline-flex size-10 items-center justify-center rounded-[10px]"
          style={{
            backgroundColor: "color-mix(in srgb, var(--primary) 16%, transparent)",
          }}
        >
          <Compass className="size-5 text-primary" />
        </div>

        <DialogTitle className="text-lg font-medium text-headingTextColor dark:text-darkTextPrimary">
          Your workspace is set up.
        </DialogTitle>

        <DialogDescription className="text-sm text-subTextColor dark:text-darkTextSecondary">
          Want a quick pass over the rest of the dashboard? {stepCount} short
          stops covering search, your metrics, navigation and settings — about a
          minute.
        </DialogDescription>

        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline2" onClick={onDecline}>
            No thanks
          </Button>
          <Button onClick={onAccept}>Show me around</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
