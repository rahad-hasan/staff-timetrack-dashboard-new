import { getLeave } from "@/actions/leaves/action";
import { ISearchParamsProps } from "@/types/type";
import LeaveRequestTable from "./LeaveRequestTable";
import AppPagination from "@/components/Common/AppPagination";

const LeaveRequestServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    // only for hr and admin set default params and rest send empty params
    const result = await getLeave({
        approved: params.approved ? params.approved : false,
        rejected: params.rejected ? params.rejected : false,
        search: params.search,
        page: params.page,
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