import AllScreenShorts from "@/components/Activity/ScreenShorts/AllScreenShorts";
import Every10Mins from "@/components/Activity/ScreenShorts/Every10Mins";
import { ISearchParamsProps } from "@/types/type";

const Every10MinsServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    type Tab = "Every 10 min" | "All Screenshots";
    const activeTab = (params?.tab as Tab) ?? "Every 10 min";

    return (
        <div>
            {
                activeTab === "Every 10 min" &&
                <Every10Mins></Every10Mins>
            }
            {/* {
                activeTab === "Every 10 min" &&
                <Every10MinsSkeleton></Every10MinsSkeleton>
            } */}
            {
                activeTab === "All Screenshots" &&
                <AllScreenShorts></AllScreenShorts>
            }
            {/* {
                activeTab === "All Screenshots" &&
                <AllScreenShortsSkeleton></AllScreenShortsSkeleton>
            } */}
        </div>
    );
};

export default Every10MinsServer;