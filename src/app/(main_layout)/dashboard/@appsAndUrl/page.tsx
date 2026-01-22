import { getDashboardAppsAndUrls } from "@/actions/dashboard/action";
import AppsAndUrl from "@/components/Dashboard/AppAndUrl/AppsAndUrl";
import { ISearchParamsProps } from "@/types/type";
import { cookies } from "next/headers";

const AppsAndUrlServer = async ({ searchParams }: ISearchParamsProps) => {
    const cookieStore = await cookies();
    const role = cookieStore.get("staffTimeDashboardRole")?.value;

    const allowedRoles = ['admin', 'manager', 'hr'];

    if (!role || !allowedRoles.includes(role)) {
        return null;
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


