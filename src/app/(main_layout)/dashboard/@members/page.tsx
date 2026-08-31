import { getDashboardMembersStats } from "@/actions/dashboard/action";
import DashboardMembersTable from "@/components/Dashboard/Members/DashboardMembersTable";
import { sampleMembersStats } from "@/lib/sampleData/fixtures";
import { getSampleDataMode } from "@/lib/sampleData/getSampleDataMode";
import { getDecodedUser } from "@/utils/decodedLogInUser";

const DashboardMembersTableServer = async () => {
    const user = await getDecodedUser();
    const role = user?.role;

    const allowedRoles = ['admin', 'manager', 'hr'];

    if (!role || !allowedRoles.includes(role)) {
        return null;
    }

    const sampleMode = await getSampleDataMode();
    const result = sampleMode
        ? null
        : await getDashboardMembersStats({
            limit: 4,
        });

    const members = sampleMode ? sampleMembersStats : result?.data?.members;

    return (
        <div>
            <DashboardMembersTable data={members}></DashboardMembersTable>
        </div>
    );
};

export default DashboardMembersTableServer;