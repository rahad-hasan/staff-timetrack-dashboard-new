"use client";

import { Loader2 } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import { IntegrationDef } from "@/components/Integrations/registry";

interface SyncProgressDialogProps {
  open: boolean;
  def: IntegrationDef;
}

const SyncProgressDialog = ({ open, def }: SyncProgressDialogProps) => {
  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md dark:bg-darkSecondaryBg"
        showCloseButton={false}
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogTitle className="sr-only">Sync in progress</DialogTitle>

        <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />

          <p className="text-sm font-medium text-headingTextColor dark:text-darkTextPrimary">
            Syncing from {def.name}…
          </p>

          <p className="max-w-sm text-xs text-subTextColor dark:text-darkTextSecondary">
            This can take a few minutes for large {def.noun.plural}. Please keep
            this window open.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SyncProgressDialog;
