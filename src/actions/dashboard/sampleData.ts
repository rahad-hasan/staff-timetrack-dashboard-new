"use server";

import { cookies } from "next/headers";
import { SAMPLE_DATA_DISMISSED_COOKIE } from "@/lib/sampleData/getSampleDataMode";

/** ~1 year — "Don't show" should outlive the 14-day new-user window. */
const MAX_AGE = 60 * 60 * 24 * 365;

/**
 * "Don't show" on the sample-data banner. A cookie rather than localStorage
 * because the dashboard slots decide server-side, during render, whether to
 * inject fixtures — client-only storage would flash demo data first.
 */
export const dismissSampleData = async () => {
  const cookieStore = await cookies();
  cookieStore.set(SAMPLE_DATA_DISMISSED_COOKIE, "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
};
