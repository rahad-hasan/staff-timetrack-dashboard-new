"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { buildLogInUserData } from "@/lib/authSession";
import {
  appendMarketingPlanIntent,
  hasPurchaseIntentShape,
  isTrialIntent,
  parseMarketingPlanIntent,
} from "@/lib/marketingPlanIntent";
import { ICreateOrganizationResponse } from "@/types/type";
import { useLogInUserStore } from "@/store/logInUserStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { resetProfileImageRefresh } from "@/utils/profileImageRefresh";

/**
 * What happens the moment `POST /company` succeeds: the response's token pair
 * is already in cookies (the server action wrote them), so all that is left
 * client-side is seeding the persisted user store and routing into whatever the
 * last onboarding step is for THIS signup.
 *
 * There are three of those, and which one applies was decided back on the
 * marketing site:
 *
 *   - **Trial intent** → `/dashboard`. The reverse trial already started inside
 *     the create transaction, on a plan the backend chose, so there is no call
 *     to make and no card to ask for — the product itself is the next screen.
 *     A `plan` id sent alongside the trial flag changes nothing HERE: it went
 *     out with `POST /company` as the plan to trial (see
 *     `useCreateOrganizationForm`), where the backend validated it, so by the
 *     time routing happens the tier is already decided either way.
 *   - **Paid-plan intent** → the plan picker WITH the intent still on the URL,
 *     where the seat dialog opens over the grid and continues to
 *     `/billing/checkout`.
 *   - **Anything else** (ordinary signup, or params we could not make sense of)
 *     → the plan picker exactly as before.
 *
 * The picker remains a suggestion, never a gate: skipping it lands on a fully
 * working trial workspace. The sidebar is preselected for the dashboard the
 * user ends up on either way.
 *
 * **This hook cannot validate the plan.** It has no plans list, and fetching
 * one here would only duplicate the request the page it is about to route to
 * already makes. So it does a SHAPE check (positive integer, not a trial) and
 * the destination does the real work — resolving the id against the live
 * catalog, rejecting the free plan and unsold cycles, and falling back to the
 * plain grid when any of that fails. Both halves live in
 * `@/lib/marketingPlanIntent`; the split is there, and this comment is here,
 * because a reader who finds only the shape check would reasonably assume the
 * id had been trusted.
 *
 * The intent is read off the current URL rather than passed in: the login page
 * mounts the very same wizard for accounts that verified but never finished,
 * and that URL simply carries no plan params — which parses to "no intent" and
 * lands on today's behaviour without that call site knowing any of this exists.
 */
export const useEnterPlanSelection = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setLogInUserData } = useLogInUserStore();
  const { setOpenMenu } = useSidebarStore();

  return useCallback(
    (data: ICreateOrganizationResponse) => {
      resetProfileImageRefresh();
      setLogInUserData(buildLogInUserData(data));
      setOpenMenu("/dashboard");

      const intent = parseMarketingPlanIntent(searchParams);

      // `replace`, not `push`, on every branch below: the page underneath is a
      // spent one-shot step (the wizard would only answer "Email already
      // exists" on a resubmit), so the Back button must not be able to
      // resurface it.
      if (isTrialIntent(intent)) {
        router.replace("/dashboard");
        return;
      }

      if (hasPurchaseIntentShape(intent)) {
        router.replace(
          appendMarketingPlanIntent("/onboarding/choose-plan", intent),
        );
        return;
      }

      router.replace("/onboarding/choose-plan");
    },
    [router, searchParams, setLogInUserData, setOpenMenu],
  );
};
