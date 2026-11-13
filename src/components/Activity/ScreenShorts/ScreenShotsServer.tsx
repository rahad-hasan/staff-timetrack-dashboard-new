import { ISearchParamsProps } from "@/types/type";
import LiveDataBoundary from "@/components/Common/LiveDataBoundary";
// import AllScreenShortsSkeleton from "@/skeleton/activity/screenShorts/AllScreenShortsSkeleton";
import Every10MinsServer from "./Every10MinsServer";
import AllScreenShortsServer from "./AllScreenShortsServer";
import {
  AllScreenshotsLightbox,
  Every10MinsLightbox,
} from "./ScreenshotLightbox";
import Every10MinsSkeleton from "@/skeleton/activity/screenShorts/Every10MinsSkeleton";
import { Suspense } from "react";
import AllScreenShortsSkeleton from "@/skeleton/activity/screenShorts/AllScreenShortsSkeleton";

const ScreenShotsServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  type Tab = "Every 10 min" | "All Screenshots";
  const activeTab = (params?.tab as Tab) ?? "Every 10 min";

  // Each lightbox wraps its view's boundary: a failed refresh swaps the grid
  // for an error card but leaves an open screenshot open.
  return (
    <div>
      {activeTab === "Every 10 min" && (
        <Suspense
          key={JSON.stringify(params)}
          fallback={<Every10MinsSkeleton />}
        >
          <Every10MinsLightbox>
            <LiveDataBoundary>
              <Every10MinsServer searchParams={searchParams}></Every10MinsServer>
            </LiveDataBoundary>
          </Every10MinsLightbox>
        </Suspense>
      )}
      {activeTab === "All Screenshots" && (
        <Suspense
          key={JSON.stringify(params)}
          fallback={<AllScreenShortsSkeleton />}
        >
          <AllScreenshotsLightbox>
            <LiveDataBoundary>
              <AllScreenShortsServer
                searchParams={searchParams}
              ></AllScreenShortsServer>
            </LiveDataBoundary>
          </AllScreenshotsLightbox>
        </Suspense>
      )}
    </div>
  );
};

export default ScreenShotsServer;
