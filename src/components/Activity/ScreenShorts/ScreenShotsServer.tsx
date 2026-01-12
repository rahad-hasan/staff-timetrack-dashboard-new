import { ISearchParamsProps } from "@/types/type";
// import AllScreenShortsSkeleton from "@/skeleton/activity/screenShorts/AllScreenShortsSkeleton";
import Every10MinsServer from "./Every10MinsServer";
import AllScreenShortsServer from "./AllScreenShortsServer";

const ScreenShotsServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    type Tab = "Every 10 min" | "All Screenshots";
    const activeTab = (params?.tab as Tab) ?? "Every 10 min";

    // const metrics = [
    //     {
    //         id: 1,
    //         value: "48%",
    //         title: "AVG ACTIVITY",
    //         change: "+1.5%",
    //         direction: "down",
    //         note: "last Monday",
    //     },
    //     {
    //         id: 2,
    //         value: "7h 24m",
    //         title: "WORKED TIME",
    //         change: "+30m",
    //         direction: "up",
    //         note: "last Monday",
    //     },
    //     {
    //         id: 3,
    //         value: "4h 12m",
    //         title: "FOCUS TIME",
    //         change: "-15m",
    //         direction: "down",
    //         note: "last Monday",
    //     },
    //     {
    //         id: 4,
    //         value: "6h 02m",
    //         title: "CORE WORK",
    //         change: "+25m",
    //         direction: "up",
    //         note: "last Monday",
    //     },
    // ];

    // console.log('result', result);
    return (
        <div>

            {
                activeTab === "Every 10 min" &&
                <Every10MinsServer searchParams={searchParams}></Every10MinsServer>
            }
            {/* {
                activeTab === "Every 10 min" &&
                <Every10MinsSkeleton></Every10MinsSkeleton>
            } */}
            {
                activeTab === "All Screenshots" &&
                <AllScreenShortsServer searchParams={searchParams}></AllScreenShortsServer>
            }
            {/* {
                activeTab === "All Screenshots" &&
                <AllScreenShortsSkeleton></AllScreenShortsSkeleton>
            } */}
        </div>
    );
};

export default ScreenShotsServer;