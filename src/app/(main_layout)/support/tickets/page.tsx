import type { Metadata } from "next";
import { getSupportCategories, getTicketCounts, getTickets } from "@/actions/support/action";
import { parseTicketListFilters } from "@/lib/support";
import TicketsPage from "@/components/Support/list/TicketsPage";
import {
  LIST_PAGE_SIZE,
  canonicalQuery,
  normaliseFilters,
  reachablePages,
  type ListFilters,
  type ListPage,
} from "@/components/Support/list/listState";
import type { ISearchParamsProps } from "@/types/type";

export const metadata: Metadata = {
  title: "My Support Tickets",
  description: "Track your open support conversations and follow up with the team.",
};

const readPage = (filters: ListFilters) =>
  getTickets({
    page: filters.page,
    limit: LIST_PAGE_SIZE,
    status: filters.status,
    category_id: filters.category_id,
    q: filters.q,
  });

/**
 * Support › My Support Tickets. First paint = three parallel reads (rows,
 * global counts, visible categories — no waterfall, plan §2.1); the client
 * container takes over from there (search, filters, pages, live updates,
 * create). The URL is the list state: `?page&status&category_id&q`.
 */
const SupportTicketsPage = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const parsed = parseTicketListFilters(params);
  let filters = normaliseFilters({
    page: parsed.page,
    status: parsed.status,
    category_id: parsed.category_id,
    q: parsed.q,
  });

  // A v1 link (`?category=<slug>`): resolve the slug once, only in that case.
  let categoriesRequest = getSupportCategories();
  if (parsed.category && filters.category_id === undefined) {
    const categories = await categoriesRequest;
    const match = categories?.success ? categories.data?.find((c) => c.slug === parsed.category) : undefined;
    if (match) filters = { ...filters, category_id: match.id };
    categoriesRequest = Promise.resolve(categories);
  }

  const [firstList, countsResponse, categoriesResponse] = await Promise.all([
    readPage(filters),
    getTicketCounts(),
    categoriesRequest,
  ]);

  // A page past the end (old bookmark, tickets left the filter): serve the last page instead.
  let listResponse = firstList;
  if (
    listResponse?.success &&
    Array.isArray(listResponse.data) &&
    listResponse.data.length === 0 &&
    listResponse.meta &&
    listResponse.meta.total > 0 &&
    filters.page > reachablePages(listResponse.meta)
  ) {
    filters = { ...filters, page: reachablePages(listResponse.meta) };
    listResponse = await readPage(filters);
  }

  const initialPage: ListPage | null =
    listResponse?.success && Array.isArray(listResponse.data)
      ? {
          rows: listResponse.data,
          meta: listResponse.meta ?? {
            page: filters.page,
            limit: LIST_PAGE_SIZE,
            total: listResponse.data.length,
            totalPages: 1,
          },
        }
      : null;
  const listOk = initialPage !== null;

  const categories =
    categoriesResponse?.success && Array.isArray(categoriesResponse.data) ? categoriesResponse.data : null;

  return (
    <TicketsPage
      // No remounting key: a server refresh (a layout server action revalidating, a soft
      // navigation) hands new props to the SAME instance, which adopts them when they match
      // the URL — an open create dialog and a half-typed search survive (useTicketList).
      initialFilters={filters}
      initialPage={initialPage}
      initialError={
        listOk ? null : listResponse?.message || "We couldn't load your tickets. Please try again."
      }
      initialCounts={countsResponse?.success && countsResponse.data ? countsResponse.data : null}
      categories={categories ?? []}
      categoriesFailed={categories === null}
      serverQuery={canonicalQuery(params)}
      renderedAt={Date.now()}
    />
  );
};

export default SupportTicketsPage;
