import { getDashboardAppsAndUrls } from "@/actions/dashboard/action";
import AppsAndUrl from "@/components/Dashboard/AppAndUrl/AppsAndUrl";
import { ISearchParamsProps } from "@/types/type";

const AppsAndUrlServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const result = await getDashboardAppsAndUrls({
        type: params.tab,
    });
    console.log("This is the data I am llslfjsldjfposdsfdsf", result);
    const finalData = result?.data?.row ? result?.data?.row : result?.data

    return (
        <div>
            <AppsAndUrl data={finalData}></AppsAndUrl>
        </div>
    );
};

export default AppsAndUrlServer;