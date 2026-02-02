import { ISearchParamsProps } from "@/types/type";
// import AllScreenShortsSkeleton from "@/skeleton/activity/screenShorts/AllScreenShortsSkeleton";
import Every10MinsServer from "./Every10MinsServer";
import AllScreenShortsServer from "./AllScreenShortsServer";

const ScreenShotsServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  type Tab = "Every 10 min" | "All Screenshots";
  const activeTab = (params?.tab as Tab) ?? "Every 10 min";

  return (
    <div>
      {activeTab === "Every 10 min" && (
        <Every10MinsServer searchParams={searchParams}></Every10MinsServer>
      )}
      {/* {
                activeTab === "Every 10 min" &&
                <Every10MinsSkeleton></Every10MinsSkeleton>
            } */}
      {activeTab === "All Screenshots" && (
        <AllScreenShortsServer
          searchParams={searchParams}
        ></AllScreenShortsServer>
      )}
      {/* {
                activeTab === "All Screenshots" &&
                <AllScreenShortsSkeleton></AllScreenShortsSkeleton>
            } */}
    </div>
  );
};

export default ScreenShotsServer;
