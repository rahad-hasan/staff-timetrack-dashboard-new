import { getDashboardAppsAndUrls } from "@/actions/dashboard/action";
import AppsAndUrl from "@/components/Dashboard/AppAndUrl/AppsAndUrl";
import { ISearchParamsProps } from "@/types/type";

const AppsAndUrlServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const result = await getDashboardAppsAndUrls({
        type: params.tab,
    });

    return (
        <div>
            <AppsAndUrl data={result?.data}></AppsAndUrl>
        </div>
    );
};

export default AppsAndUrlServer;