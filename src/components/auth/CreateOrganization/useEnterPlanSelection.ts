"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

import { buildLogInUserData } from "@/lib/authSession";
import { ICreateOrganizationResponse } from "@/types/type";
import { useLogInUserStore } from "@/store/logInUserStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { resetProfileImageRefresh } from "@/utils/profileImageRefresh";

/**
 * What happens the moment `POST /company` succeeds: the response's token pair
 * is already in cookies (the server action wrote them), so all that is left
 * client-side is seeding the persisted user store and routing into the last
 * onboarding step — the plan picker.
 *
 * The reverse trial started inside the create transaction, so the picker is a
 * suggestion, never a gate: skipping it lands on a fully working trial
 * workspace. The sidebar is preselected for the dashboard the user ends up on
 * either way.
 */
export const useEnterPlanSelection = () => {
  const router = useRouter();
  const { setLogInUserData } = useLogInUserStore();
  const { setOpenMenu } = useSidebarStore();

  return useCallback(
    (data: ICreateOrganizationResponse) => {
      resetProfileImageRefresh();
      setLogInUserData(buildLogInUserData(data));
      setOpenMenu("/dashboard");
      // `replace`, not `push`: the page underneath is a spent one-shot step
      // (the wizard would only answer "Email already exists" on a resubmit),
      // so the Back button must not be able to resurface it.
      router.replace("/onboarding/choose-plan");
    },
    [router, setLogInUserData, setOpenMenu],
  );
};
