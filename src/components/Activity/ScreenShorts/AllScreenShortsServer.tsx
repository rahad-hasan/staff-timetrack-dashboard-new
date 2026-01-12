import { ISearchParamsProps } from "@/types/type";
import AllScreenShorts from "./AllScreenShorts";
import { getAllScreenshots } from "@/actions/screenshots/action";

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
            <AllScreenShorts data={result?.data}></AllScreenShorts>
        </div>
    );
};

export default AllScreenShortsServer;