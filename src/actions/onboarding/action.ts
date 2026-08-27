"use server";

import { baseApi } from "../baseApi";
import { IResponse } from "@/types/type";
import { IOnboardingStatus, IOnboardingStatusUpdate } from "@/types/onboarding";

/**
 * Onboarding / product-tour state (backend module `Onboarding`, mounted at
 * `/user`). Every authenticated role has a state — these are not admin-only.
 *
 * Follows the newer, typed action convention (see `src/actions/support/action.ts`):
 * explicit `IResponse<T>` returns and a hoisted tag constant.
 *
 * `cache: "no-cache"` on the read is not optional. The status drives whether a
 * full-screen welcome modal opens, so a 60-second stale window would re-open a
 * modal the user had already dismissed — and the PATCH below shares the tag,
 * which means baseApi's auto-revalidate keeps server-rendered consumers honest.
 */
const TAG = "onboarding-status";

export const getOnboardingStatus = async (): Promise<
  IResponse<IOnboardingStatus>
> =>
  await baseApi(`/user/onboarding-status`, {
    tag: TAG,
    cache: "no-cache",
  });

export const updateOnboardingStatus = async (
  payload: IOnboardingStatusUpdate,
): Promise<IResponse<IOnboardingStatus>> =>
  await baseApi(`/user/onboarding-status`, {
    method: "PATCH",
    body: payload,
    tag: TAG,
    cache: "no-cache",
  });
