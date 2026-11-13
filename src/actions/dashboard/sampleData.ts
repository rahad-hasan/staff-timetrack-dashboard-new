"use server";

import { cookies } from "next/headers";
import { SAMPLE_DATA_DISMISSED_COOKIE } from "@/lib/sampleData/getSampleDataMode";
import { getDecodedUser } from "@/utils/decodedLogInUser";

/** ~1 year — "Don't show" should outlive the 14-day new-user window. */
const MAX_AGE = 60 * 60 * 24 * 365;

/**
 * "Don't show" on the sample-data banner. A cookie rather than localStorage
 * because the dashboard slots decide server-side, during render, whether to
 * inject fixtures — client-only storage would flash demo data first.
 *
 * The value is the id of the user who dismissed it, and the gate honours it
 * only for that user: the browser may be shared, and one admin's choice must
 * neither hide the demo from the next admin nor be wiped at their own next
 * sign-in (clearing it at sign-in/out, the earlier fix, did the latter).
 */
export const dismissSampleData = async () => {
  const user = await getDecodedUser();
  if (user?.id === undefined || user?.id === null) return;
  const cookieStore = await cookies();
  cookieStore.set(SAMPLE_DATA_DISMISSED_COOKIE, String(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
};
