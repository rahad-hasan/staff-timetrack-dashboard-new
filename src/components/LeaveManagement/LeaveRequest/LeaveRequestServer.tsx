import { getLeave } from "@/actions/leaves/action";
import { ISearchParamsProps } from "@/types/type";
import LeaveRequestTable from "./LeaveRequestTable";
import AppPagination from "@/components/Common/AppPagination";

const LeaveRequestServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const result = await getLeave({
        approved: false,
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