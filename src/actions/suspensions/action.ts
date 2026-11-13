"use server";

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
    // A fixed backend catalogue (deploy-time data, identical for every
    // tenant) — the one read that legitimately opts into the Data Cache.
    cacheFor: 60 * 60 * 24,
  });
};

export const listSuspensionSummary = async (
  query: ISuspensionSummaryQuery = {},
): Promise<IResponse<ISuspensionSummary>> => {
  return await baseApi(`${BASE}/summary`, {
    query: { ...query },
    tag: "tracking-suspension-summary",
  });
};

export const listSuspensionEvents = async (
  query: ISuspensionEventsQuery = {},
): Promise<IResponse<ISuspensionEvent[]>> => {
  return await baseApi(`${BASE}`, {
    query: { ...query },
    tag: "tracking-suspension-events",
  });
};

export const getSuspensionEventDetail = async (
  id: number,
  query: { timezone?: string } = {},
): Promise<IResponse<ISuspensionEventDetail>> => {
  return await baseApi(`${BASE}/${id}`, {
    query,
    tag: `tracking-suspension-event-${id}`,
  });
};
