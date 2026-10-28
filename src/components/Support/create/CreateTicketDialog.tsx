"use client";

import { useState, type RefObject } from "react";
import type { SupportCategory, TicketRequesterDetail } from "@/types/support";
import { SupportDialog } from "@/components/Support/primitives";
import { CreateTicketForm, type CreateTicketDraft } from "./CreateTicketForm";

export interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: SupportCategory[];
  categoriesFailed: boolean;
  onRetryCategories: () => Promise<unknown> | void;
  onCategoryHidden: () => void;
  onDuplicateDetected: () => void;
  /** text restored from the last unsent attempt */
  draft: CreateTicketDraft | null;
  /** what is typed, as it changes — the page keeps it for the next open */
  onDraftChange: (draft: CreateTicketDraft | null) => void;
  onCreated: (ticket: TicketRequesterDetail) => void;
  /** focus target on close when the button that opened the dialog is gone (the hero "Create ticket") */
  returnFocusRef?: RefObject<HTMLElement | null>;
}

/**
 * The list page's create modal (REQ-U-18, plan §3.2): SupportDialog lg —
 * focus trapped and restored, labelled + described, Escape / outside click /
 * the X blocked while the request is in flight so a half-sent ticket never
 * closes under the user. Loaded on demand (next/dynamic) by the list page.
 */
export const CreateTicketDialog = ({
  open,
  onOpenChange,
  categories,
  categoriesFailed,
  onRetryCategories,
  onCategoryHidden,
  onDuplicateDetected,
  draft,
  onDraftChange,
  onCreated,
  returnFocusRef,
}: CreateTicketDialogProps) => {
  const [busy, setBusy] = useState(false);
  return (
    <SupportDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create a support ticket"
      description="Tell us what's going on. Our team replies here, and we'll email you when they do."
      busy={busy}
      size="lg"
      contentClassName="pt-4"
      returnFocusRef={returnFocusRef}
    >
      <CreateTicketForm
        variant="dialog"
        categories={categories}
        categoriesFailed={categoriesFailed}
        onRetryCategories={onRetryCategories}
        onCategoryHidden={onCategoryHidden}
        onDuplicateDetected={onDuplicateDetected}
        initialValues={draft ?? undefined}
        onDraftChange={onDraftChange}
        onBusyChange={setBusy}
        onCancel={() => onOpenChange(false)}
        onCreated={onCreated}
      />
    </SupportDialog>
  );
};

export default CreateTicketDialog;
