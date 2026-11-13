import { getDashboardAppsAndUrls } from "@/actions/dashboard/action";
import LiveDataBoundary from "@/components/Common/LiveDataBoundary";
import AppsAndUrl from "@/components/Dashboard/AppAndUrl/AppsAndUrl";
import {
    parseDashboardTab,
    type DashboardTab,
} from "@/components/Dashboard/dashboardParams";
import { MANAGEMENT_ROLES, hasRole } from "@/lib/roles";
import { sampleAppsAndUrls } from "@/lib/sampleData/fixtures";
import { getSampleDataMode } from "@/lib/sampleData/getSampleDataMode";
import { requireLiveData } from "@/lib/server/liveData";
import { ISearchParamsProps } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";

/** The period each tab's request covers, as the API titles it. */
const RANGE_LABELS: Record<DashboardTab, string> = {
    daily: "Today",
    // Rolling windows, not calendar periods (the hero heading above names those).
    weekly: "Last 7 Days",
    monthly: "Last 30 Days",
};

const AppsAndUrlServer = async ({ searchParams }: ISearchParamsProps) => {
    const user = await getDecodedUser();

    if (!hasRole(MANAGEMENT_ROLES, user?.role)) {
        return null;
    }

    const tab = parseDashboardTab((await searchParams).tab);

    // A failed read costs only this panel, and clears on the next tab or sort change.
    return (
        <LiveDataBoundary title="Apps & URL">
            <AppsAndUrlPanel tab={tab} />
        </LiveDataBoundary>
    );
};

async function AppsAndUrlPanel({ tab }: { tab: DashboardTab }) {
    // The live read starts alongside the sample-data gate, not after it.
    const [sampleMode, result] = await Promise.all([
        getSampleDataMode(),
        getDashboardAppsAndUrls({ type: tab }),
    ]);

    // A failed live read throws into this panel's boundary.
    const usage = sampleMode
        ? undefined
        : requireLiveData(result, "apps and URLs");

    const finalData = sampleMode
        ? sampleAppsAndUrls
        : usage?.row ? usage?.row : usage;

    // The header names the period the numbers cover. The API's own title
    // comes first: it states the window it actually answered for, whichever
    // backend build is serving (an older one answered `daily` with 7 days
    // titled "This Week"). The tab only stands in for an answer without one.
    // The fixtures are a week of usage with a share for today, whatever the tab.
    const apiTitle: unknown = usage?.title;
    const rangeLabel = sampleMode
        ? RANGE_LABELS.weekly
        : typeof apiTitle === "string" && apiTitle
            ? apiTitle
            : RANGE_LABELS[tab];

    return (
        <div>
            <AppsAndUrl
                data={finalData}
                rangeLabel={rangeLabel}
                showToday={rangeLabel !== RANGE_LABELS.daily}
            ></AppsAndUrl>
        </div>
    );
}

export default AppsAndUrlServer;
