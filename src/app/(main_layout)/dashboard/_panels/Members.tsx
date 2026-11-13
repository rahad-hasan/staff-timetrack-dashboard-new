import { getDashboardMembersStats } from "@/actions/dashboard/action";
import LiveDataBoundary from "@/components/Common/LiveDataBoundary";
import DashboardMembersTable from "@/components/Dashboard/Members/DashboardMembersTable";
import { MANAGEMENT_ROLES, hasRole } from "@/lib/roles";
import { sampleMembersStats } from "@/lib/sampleData/fixtures";
import { getSampleDataMode } from "@/lib/sampleData/getSampleDataMode";
import { requireLiveData } from "@/lib/server/liveData";
import { getDecodedUser } from "@/utils/decodedLogInUser";

const DashboardMembersTableServer = async () => {
    const user = await getDecodedUser();

    if (!hasRole(MANAGEMENT_ROLES, user?.role)) {
        return null;
    }

    // A failed read costs only this panel, and clears on the next tab or sort change.
    return (
        <LiveDataBoundary title="Members">
            <MembersPanel />
        </LiveDataBoundary>
    );
};

async function MembersPanel() {
    // Started alongside the sample-data gate. It is also the exact request
    // the gate's activity probe makes, so in one render the two share a
    // single round trip.
    const [sampleMode, result] = await Promise.all([
        getSampleDataMode(),
        getDashboardMembersStats({ limit: 4 }),
    ]);

    const members = sampleMode
        ? sampleMembersStats
        : requireLiveData(result, "the members panel").members;

    return (
        <div>
            <DashboardMembersTable data={members}></DashboardMembersTable>
        </div>
    );
}

export default DashboardMembersTableServer;
