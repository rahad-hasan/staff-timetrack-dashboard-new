import type { Metadata } from "next";
import { getSupportCategories } from "@/actions/support/action";
import NewTicketPageView from "@/components/Support/create/NewTicketPageView";
import { newTicketDraftSearchSchema } from "@/zod/supportSchema";
import type { ISearchParamsProps } from "@/types/type";

export const metadata: Metadata = {
  title: "Create Support Ticket",
  description: "Send a new support ticket to the team.",
};

const first = (value: string | string[] | number | undefined) =>
  Array.isArray(value) ? value[0] : value === undefined ? undefined : String(value);

/**
 * Full-page create form: deep links and the reopen-as-new prefill
 * (`newTicketHref(draft)` ↔ `newTicketDraftSearchSchema`; every field
 * optional and tolerant — a bad value is dropped, never an error page).
 */
const NewTicketPage = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const draft = newTicketDraftSearchSchema.parse({
    title: first(params.title),
    category_id: first(params.category_id),
    reopened_from_id: first(params.reopened_from_id),
    reopened_from_display_number: first(params.reopened_from_display_number),
  });
  const categories = await getSupportCategories();
  const loaded = categories?.success && Array.isArray(categories.data) ? categories.data : null;
  return <NewTicketPageView categories={loaded ?? []} categoriesFailed={loaded === null} draft={draft} />;
};

export default NewTicketPage;
