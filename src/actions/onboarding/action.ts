"use server";

import { baseApi } from "../baseApi";
import { IResponse } from "@/types/type";
import { IOnboardingStatus, IOnboardingStatusUpdate } from "@/types/onboarding";

/**
 * Onboarding / product-tour state (backend module `Onboarding`, mounted at
 * `/user`). Every authenticated role has a state — these are not admin-only.
 *
 * Follows the newer, typed action convention (see `src/actions/support/action.ts`):
 * explicit `IResponse<T>` returns.
 *
 * The read must stay live (baseApi's default — never give it `cacheFor`). The
 * status drives whether a full-screen welcome modal opens, so any stale window
 * would re-open a modal the user had already dismissed.
 *
 * `getOnboardingStatus` is for server renders only (the layout, the
 * sample-data gate). The browser reads the status through
 * `GET /api/onboarding-status` (`onboardingStore.fetchStatus`), never by
 * calling this as a server action: see that route for what it crashed.
 */
export const getOnboardingStatus = async (): Promise<
  IResponse<IOnboardingStatus>
> => await baseApi(`/user/onboarding-status`);

/**
 * Deliberately untagged, and `skipRevalidate` so a tag added later cannot
 * bring the cost back: a revalidating write makes the server action re-render
 * the whole current route into its response — on /dashboard the layout plus
 * all seven panels — and the tour PATCHes once per step. Nothing on the
 * server needs that render: the store adopts the PATCH response itself, the
 * layout's status read only seeds the store when the gate mounts, and the
 * sample-data gate reads `isNewUser`, which the backend derives from
 * `created_at` and no PATCH can change.
 */
export const updateOnboardingStatus = async (
  payload: IOnboardingStatusUpdate,
): Promise<IResponse<IOnboardingStatus>> =>
  await baseApi(`/user/onboarding-status`, {
    method: "PATCH",
    body: payload,
    skipRevalidate: true,
  });
