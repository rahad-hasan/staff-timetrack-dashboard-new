import { ISearchParamsProps } from "@/types/type";
import LiveDataBoundary from "@/components/Common/LiveDataBoundary";
import ScreenshotsDayServer, {
  readScreenshotsDay,
  ScreenshotsDayView,
} from "./ScreenshotsDayServer";
import { fulfilledWithin } from "@/lib/server/liveData";
import {
  AllScreenshotsLightbox,
  Every10MinsLightbox,
} from "./ScreenshotLightbox";
import { Suspense } from "react";
import ScreenshotsSkeleton from "./ScreenshotsSkeleton";
import { screenshotDayKey } from "./screenshotTabs";

/**
 * How long the page waits for the day's read before it renders the skeleton
 * instead (see fulfilledWithin). The read takes 40-160 ms, so in the usual
 * case the grid arrives with the page, and with the answer to a filter
 * change, and no skeleton is shown at all. This is the most a slow read adds
 * before the skeleton appears.
 */
const FAST_READ_MS = 200;

const ScreenShotsServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const day = readScreenshotsDay(params);
  // Null for a read that is slow, and for one that failed: both are awaited
  // under the boundary below, which is where a failure belongs.
  const ready = await fulfilledWithin(day, FAST_READ_MS);

  // Nothing here depends on the tab: both views come from the one read
  // above, and the client switches between them without a request.
  //
  // Each lightbox wraps the boundary: a failed refresh swaps the grid for an
  // error card but leaves an open screenshot open. Both are mounted whichever
  // tab is showing, so switching tabs keeps them.
  return (
    <div>
      <Suspense
        key={screenshotDayKey(params)}
        fallback={<ScreenshotsSkeleton />}
      >
        <Every10MinsLightbox>
          <AllScreenshotsLightbox>
            <LiveDataBoundary>
              {ready ? (
                <ScreenshotsDayView read={ready.value} />
              ) : (
                <ScreenshotsDayServer day={day} />
              )}
            </LiveDataBoundary>
          </AllScreenshotsLightbox>
        </Every10MinsLightbox>
      </Suspense>
    </div>
  );
};

export default ScreenShotsServer;
