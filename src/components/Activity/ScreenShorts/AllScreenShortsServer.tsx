import { ISearchParamsProps } from "@/types/type";
import AllScreenShorts from "./AllScreenShorts";
import { getAllScreenshots } from "@/actions/screenshots/action";
import { Suspense } from "react";
import AllScreenShortsSkeleton from "@/skeleton/activity/screenShorts/AllScreenShortsSkeleton";

const AllScreenShortsServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    let result;
    if (params.date && params.user_id) {
        result = await getAllScreenshots({
            date: params.date,
            user_id: params.user_id,
        });
    }

    return (
        <div>
            <Suspense fallback={<AllScreenShortsSkeleton />}>
                {
                    params.date && params.user_id ?
                        <AllScreenShorts data={result?.data}></AllScreenShorts>
                        :
                        <AllScreenShortsSkeleton />
                }
            </Suspense>
        </div>
    );
};

export default AllScreenShortsServer;