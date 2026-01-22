import { getDashboardMembersStats } from "@/actions/dashboard/action";
import DashboardMembersTable from "@/components/Dashboard/Members/DashboardMembersTable";
import { cookies } from "next/headers";

const DashboardMembersTableServer = async () => {
    const cookieStore = await cookies();
    const role = cookieStore.get("staffTimeDashboardRole")?.value;

    const allowedRoles = ['admin', 'manager', 'hr'];

    if (!role || !allowedRoles.includes(role)) {
        return null;
    }

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