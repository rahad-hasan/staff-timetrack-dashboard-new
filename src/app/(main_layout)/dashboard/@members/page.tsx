import { getDashboardMembersStats } from "@/actions/dashboard/action";
import DashboardMembersTable from "@/components/Dashboard/Members/DashboardMembersTable";

const DashboardMembersTableServer = async() => {
    const result = await getDashboardMembersStats({
        limit: 4,
    });
    console.log(result?.data?.members);
    return (
        <div>
            <DashboardMembersTable></DashboardMembersTable>
        </div>
    );
};

export default DashboardMembersTableServer;