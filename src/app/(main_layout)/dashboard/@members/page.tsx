import { getDashboardMembersStats } from "@/actions/dashboard/action";
import DashboardMembersTable from "@/components/Dashboard/Members/DashboardMembersTable";

const DashboardMembersTableServer = async() => {
    const result = await getDashboardMembersStats({
        limit: 4,
    });

    return (
        <div>
            <DashboardMembersTable data={result?.data?.members}></DashboardMembersTable>
        </div>
    );
};

export default DashboardMembersTableServer;