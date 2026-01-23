import { ISearchParamsProps } from "@/types/type";
import ManualRequestsTable from "./ManualRequestsTable";
import { getManualTimeEntry } from "@/actions/timesheets/action";
import AppPagination from "@/components/Common/AppPagination";
import { getDecodedUser } from "@/utils/decodedLogInUser";

const ManualRequestTableServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    // if(params?.user_id && params?.page){
    const user = await getDecodedUser();
    // }
    const result = await getManualTimeEntry({
        user_id: params?.user_id ?? user?.id,
        search: params.search,
        page: params.page,
    });

    return (
        <div>
            <ManualRequestsTable data={result?.data} />
            {/* Nullish Coalescing Operator. ?? when its left-hand side operand is null or undefined. Otherwise, it returns its left-hand side operand.*/}
            <AppPagination
                total={result?.meta?.total ?? 1}
                currentPage={params.page as number}
                limit={result?.meta?.limit ?? 10}
            />
        </div>
    );
};

export default ManualRequestTableServer;