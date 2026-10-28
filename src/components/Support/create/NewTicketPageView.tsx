"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SUPPORT_TICKETS_PATH, supportApi, ticketHref } from "@/lib/support";
import type { SupportCategory, TicketRequesterDetail } from "@/types/support";
import type { NewTicketDraft } from "@/zod/supportSchema";
import { FOCUS_RING, notifySupport, useLatestRequest } from "@/components/Support/primitives";
import { CreateTicketForm } from "./CreateTicketForm";
import { cn } from "@/lib/utils";

interface NewTicketPageViewProps {
  categories: SupportCategory[];
  categoriesFailed: boolean;
  /** `?title&category_id&reopened_from_id&reopened_from_display_number` (reopen-as-new), already parsed */
  draft: NewTicketDraft;
}

/**
 * /support/tickets/new — the same form as the list's modal, full page: the
 * deep link and the ticket page's "Open a new ticket" (reopen-as-new draft,
 * `newTicketHref(draft)`). On success: the toast, then the new ticket.
 */
export const NewTicketPageView = ({ categories: initialCategories, categoriesFailed, draft }: NewTicketPageViewProps) => {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [failed, setFailed] = useState(categoriesFailed);
  const { run } = useLatestRequest();

  const reloadCategories = useCallback(async () => {
    const result = await run((signal) => supportApi.getCategories({ signal }));
    if (!result.ok && result.aborted) return;
    if (result.ok) {
      setCategories(result.data);
      setFailed(false);
    } else {
      setFailed(true);
    }
  }, [run]);

  const onCreated = useCallback(
    (ticket: TicketRequesterDetail) => {
      // A replayed answer (a retry after a lost response) is still the user's first success.
      notifySupport.success("Ticket created", {
        description: ticket.display_number,
      });
      router.push(ticketHref(ticket.id));
    },
    [router],
  );

  /** An earlier attempt already created it (its answer was lost): go to the list, where it is. */
  const onDuplicateDetected = useCallback(() => {
    notifySupport.info("Ticket already created", {
      description: "Your earlier attempt went through, so we didn't send it twice.",
      id: "support-ticket-duplicate",
    });
    router.push(SUPPORT_TICKETS_PATH);
  }, [router]);

  const reopenedFrom = draft.reopened_from_id
    ? { id: draft.reopened_from_id, displayNumber: draft.reopened_from_display_number ?? null }
    : null;

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-5">
      <Link
        href={SUPPORT_TICKETS_PATH}
        className={cn("inline-flex w-fit items-center gap-1.5 rounded-md text-[14px] font-medium leading-5 text-subTextColor outline-none transition-colors hover:text-headingTextColor dark:text-darkTextSecondary dark:hover:text-darkTextPrimary", FOCUS_RING)}
      >
        <ArrowLeft aria-hidden="true" size={16} strokeWidth={2} />
        My Support Tickets
      </Link>
      <div>
        <h1 className="text-[24px] font-medium leading-8 text-headingTextColor dark:text-darkTextPrimary">
          Create a support ticket
        </h1>
        <p className="mt-1 text-[15px] leading-[23px] text-subTextColor dark:text-darkTextSecondary">
          Tell us what&apos;s going on. Our team replies here, and we&apos;ll email you when they do.
        </p>
      </div>
      <section
        aria-label="New ticket"
        className="rounded-2xl border border-borderColor bg-white p-5 sm:p-6 dark:border-darkBorder dark:bg-darkSecondaryBg"
      >
        <CreateTicketForm
          variant="page"
          categories={categories}
          categoriesFailed={failed}
          onRetryCategories={reloadCategories}
          onCategoryHidden={() => void reloadCategories()}
          initialValues={{ title: draft.title, category_id: draft.category_id }}
          reopenedFrom={reopenedFrom}
          // "Open a new ticket" lands here with the title filled in: the Description is what is left
          // (otherwise a keyboard user tabs through the app shell to reach the form — step-9c review)
          autoFocusField={draft.title ? "description" : "title"}
          onCancel={() => router.push(SUPPORT_TICKETS_PATH)}
          onCreated={onCreated}
          onDuplicateDetected={onDuplicateDetected}
        />
      </section>
    </div>
  );
};

export default NewTicketPageView;
