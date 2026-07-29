import { getDashboardMembersStats } from "@/actions/dashboard/action";
import DashboardMembersTable from "@/app/(main_layout)/dashboard/@members/_components/DashboardMembersTable";
import { getDecodedUser } from "@/utils/decodedLogInUser";

const DashboardMembersTableServer = async () => {
    const user = await getDecodedUser();
    const role = user?.role;

    const allowedRoles = ['admin', 'manager', 'hr'];

    if (!role || !allowedRoles.includes(role)) {
        return null;
    }

    const result = await getDashboardMembersStats({
        limit: 4,
    });

    return (
        <DashboardMembersTable data={result?.data?.members}></DashboardMembersTable>
    );
};

export default DashboardMembersTableServer;