import { ISearchParamsProps } from "@/types/type";
// import AllScreenShortsSkeleton from "@/skeleton/activity/screenShorts/AllScreenShortsSkeleton";
import Every10MinsServer from "./Every10MinsServer";
import AllScreenShortsServer from "./AllScreenShortsServer";
import Every10MinsSkeleton from "@/skeleton/activity/screenShorts/Every10MinsSkeleton";
import { Suspense } from "react";
import AllScreenShortsSkeleton from "@/skeleton/activity/screenShorts/AllScreenShortsSkeleton";

const ScreenShotsServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  type Tab = "Every 10 min" | "All Screenshots";
  const activeTab = (params?.tab as Tab) ?? "Every 10 min";

  return (
    <div>
      {activeTab === "Every 10 min" && (
        <Suspense
          key={JSON.stringify(params)}
          fallback={<Every10MinsSkeleton />}
        >
          <Every10MinsServer searchParams={searchParams}></Every10MinsServer>
        </Suspense>
      )}
      {activeTab === "All Screenshots" && (
        <Suspense
          key={JSON.stringify(params)}
          fallback={<AllScreenShortsSkeleton />}
        >
          <AllScreenShortsServer
            searchParams={searchParams}
          ></AllScreenShortsServer>
        </Suspense>
      )}
    </div>
  );
};

export default ScreenShotsServer;
