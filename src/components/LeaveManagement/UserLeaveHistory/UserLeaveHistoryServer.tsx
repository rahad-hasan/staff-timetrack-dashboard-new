import { ISearchParams } from "@/types/type";
import UserLeaveHistoryTable from "./UserLeaveHistoryTable";
import { getLeave } from "@/actions/leaves/action";
import AppPagination from "@/components/Common/AppPagination";

interface IPageProps {
    id: string;
    searchParams: ISearchParams;
}
const UserLeaveHistoryServer = async ({ id, searchParams }: IPageProps) => {
    const params = await searchParams;
    const result = await getLeave({
        user_id: id,
        search: params.search,
        page: params.page,
    });
    return (
        <div>
            <UserLeaveHistoryTable data={result?.data} />
            <AppPagination
                total={result?.meta?.total ?? 1}
                currentPage={params.page as number}
                limit={result?.meta?.limit ?? 10}
            />
        </div>
    );
};

export default UserLeaveHistoryServer;

