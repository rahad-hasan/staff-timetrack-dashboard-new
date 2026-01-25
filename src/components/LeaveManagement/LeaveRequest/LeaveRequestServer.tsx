import { getLeave } from "@/actions/leaves/action";
import { ISearchParamsProps } from "@/types/type";
import LeaveRequestTable from "./LeaveRequestTable";
import AppPagination from "@/components/Common/AppPagination";
import { cookies } from "next/headers";

const LeaveRequestServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const cookieStore = await cookies();
    const role = cookieStore.get("staffTimeDashboardRole")?.value;
    const allowedRoles = ['admin', 'manager', 'hr'];
    const isAuthorized = allowedRoles.includes(role!)

    const roleBaseApproved = isAuthorized ? params.approved ?? false : params.approved;
    const roleBaseRejected = isAuthorized ? params.rejected ?? false : params.rejected;
    
    const result = await getLeave({
        search: params.search,
        page: params.page,
        rejected: roleBaseRejected,
        approved: roleBaseApproved,
    });

    return (
        <>
            <LeaveRequestTable data={result?.data} />
            <AppPagination
                total={result?.meta?.total ?? 1}
                currentPage={params.page as number}
                limit={result?.meta?.limit ?? 10}
            />
        </>
    );
};

export default LeaveRequestServer;