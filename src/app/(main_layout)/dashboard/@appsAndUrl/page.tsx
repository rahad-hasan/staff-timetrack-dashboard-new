import { getDashboardAppsAndUrls } from "@/actions/dashboard/action";
import AppsAndUrl from "@/components/Dashboard/AppAndUrl/AppsAndUrl";
import { sampleAppsAndUrls } from "@/lib/sampleData/fixtures";
import { getSampleDataMode } from "@/lib/sampleData/getSampleDataMode";
import { ISearchParamsProps } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";

const AppsAndUrlServer = async ({ searchParams }: ISearchParamsProps) => {
    const user = await getDecodedUser();
    const role = user?.role;

    const allowedRoles = ['admin', 'manager', 'hr'];

    if (!role || !allowedRoles.includes(role)) {
        return null;
    }

    const sampleMode = await getSampleDataMode();
    if (sampleMode) {
        return (
            <div>
                <AppsAndUrl data={sampleAppsAndUrls}></AppsAndUrl>
            </div>
        );
    }

    const params = await searchParams;
    const result = await getDashboardAppsAndUrls({
        type: params.tab,
    });

    const finalData = result?.data?.row ? result?.data?.row : result?.data

    return (
        <div>
            <AppsAndUrl data={finalData}></AppsAndUrl>
        </div>
    );
};

export default AppsAndUrlServer;


