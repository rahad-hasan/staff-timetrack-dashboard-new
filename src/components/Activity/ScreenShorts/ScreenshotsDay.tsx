"use client";

import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import type { IAllScreenshot, TTimelineHourBlock } from "@/types/type";
import AllScreenShorts from "./AllScreenShorts";
import Every10Mins from "./Every10Mins";
import ScreenshotsSummary, {
  type ScreenshotDayTotals,
} from "./ScreenshotsSummary";
import { ALL_SCREENSHOTS_TAB, resolveScreenshotTab } from "./screenshotTabs";

interface ScreenshotsDayProps {
  /** The day as GET /activities returns it: hours of 10-minute slots. */
  hours: TTimelineHourBlock[];
  /** The day's totals, for the cards above the 10-minute view. */
  totals: ScreenshotDayTotals;
  canDelete: boolean;
  /** Shown in place of the empty-day text: why the API refused the read. */
  message?: string;
}

/**
 * One day of screenshots, in the view `?tab` names.
 *
 * The tab is read from the URL here, on the client, and the toggle changes it
 * with history.pushState (see ScreenshotsToggle): switching views is a
 * re-render of data already in the browser, with no request and no skeleton.
 * A hard load, a filter change and a live refresh still render the right view
 * on the server, since this reads the same `?tab` there.
 */
const ScreenshotsDay = ({
  hours,
  totals,
  canDelete,
  message,
}: ScreenshotsDayProps) => {
  const tab = resolveScreenshotTab(useSearchParams().get("tab"));

  if (tab === ALL_SCREENSHOTS_TAB) {
    return <AllScreenshotsOfDay hours={hours} message={message} />;
  }

  return (
    <div className="min-h-[80vh] xl:h-auto">
      <ScreenshotsSummary totals={totals} />
      <Every10Mins data={hours} canDelete={canDelete} message={message} />
    </div>
  );
};

/** The day's screenshots in capture order: every slot's, hour after hour. */
const AllScreenshotsOfDay = ({
  hours,
  message,
}: Pick<ScreenshotsDayProps, "hours" | "message">) => {
  const screenshots = useMemo<IAllScreenshot[]>(
    () =>
      hours.flatMap((hour) =>
        hour.slots.flatMap((slot) =>
          slot.type === "data" ? slot.details : [],
        ),
      ),
    [hours],
  );

  return (
    <div>
      <AllScreenShorts data={screenshots} message={message} />
    </div>
  );
};

export default ScreenshotsDay;
