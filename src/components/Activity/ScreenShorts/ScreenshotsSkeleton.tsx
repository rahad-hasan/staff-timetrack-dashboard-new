"use client";

import { useSearchParams } from "next/navigation";
import AllScreenShortsSkeleton from "@/skeleton/activity/screenShorts/AllScreenShortsSkeleton";
import Every10MinsSkeleton from "@/skeleton/activity/screenShorts/Every10MinsSkeleton";
import { ALL_SCREENSHOTS_TAB, resolveScreenshotTab } from "./screenshotTabs";

/**
 * The loading state of the screenshots page, in the shape of the view the
 * URL names.
 *
 * A client component for what it does to the response, not for interactivity.
 * Rendered on the server, the skeleton's markup was written into the same
 * piece of the response as the Suspense boundary it is the fallback of. React
 * splits a piece that grows past ~3 kB, and what it splits off is whatever
 * comes after: the boundary's content. The browser then held the boundary
 * without its content for a moment, drew this skeleton, and (React keeps a
 * shown fallback up for ~300 ms) kept it there over a grid it already had.
 * As a client component it is one short reference in the response.
 */
const ScreenshotsSkeleton = () => {
  const tab = resolveScreenshotTab(useSearchParams().get("tab"));

  return tab === ALL_SCREENSHOTS_TAB ? (
    <AllScreenShortsSkeleton />
  ) : (
    <Every10MinsSkeleton />
  );
};

export default ScreenshotsSkeleton;
