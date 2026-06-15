"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import type { IResponse } from "@/types/type";
import type {
  ISuspensionEvent,
  ISuspensionEventDetail,
  ISuspensionEventsQuery,
  ISuspensionReasonOption,
  ISuspensionSummary,
  ISuspensionSummaryQuery,
} from "@/types/trackingSuspension";

const BASE = "/tracking-suspensions";

export const listSuspensionReasons = async (): Promise<
  IResponse<ISuspensionReasonOption[]>
> => {
  return await baseApi(`${BASE}/reasons`, {
    tag: "tracking-suspension-reasons",
    revalidate: 60 * 60 * 24,
  });
};

export const listSuspensionSummary = async (
  query: ISuspensionSummaryQuery = {},
): Promise<IResponse<ISuspensionSummary>> => {
  const qs = buildQuery(query as Record<string, string | number | undefined>);
  return await baseApi(`${BASE}/summary${qs ? `?${qs}` : ""}`, {
    tag: "tracking-suspension-summary",
    cache: "no-cache",
  });
};

export const listSuspensionEvents = async (
  query: ISuspensionEventsQuery = {},
): Promise<IResponse<ISuspensionEvent[]>> => {
  const qs = buildQuery(query as Record<string, string | number | undefined>);
  return await baseApi(`${BASE}${qs ? `?${qs}` : ""}`, {
    tag: "tracking-suspension-events",
    cache: "no-cache",
  });
};

export const getSuspensionEventDetail = async (
  id: number,
  query: { timezone?: string } = {},
): Promise<IResponse<ISuspensionEventDetail>> => {
  const qs = buildQuery(query);
  return await baseApi(`${BASE}/${id}${qs ? `?${qs}` : ""}`, {
    tag: `tracking-suspension-event-${id}`,
    cache: "no-cache",
  });
};
