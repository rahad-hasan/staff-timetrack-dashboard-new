import { ISearchParamsProps } from "@/types/type";
import ManualRequestsTable from "./ManualRequestsTable";
import { getManualTimeEntry } from "@/actions/timesheets/action";
import AppPagination from "@/components/Common/AppPagination";
import { requireDataOrRefusal } from "@/lib/server/liveData";

const ManualRequestTableServer = async ({
  searchParams,
  canApprove,
}: ISearchParamsProps & { canApprove: boolean }) => {
  const params = await searchParams;
  const result = await getManualTimeEntry({
    user_id: params?.user_id,
    search: params?.search,
    page: params?.page,
    project_id: params?.project_id,
    date: params?.date,
  });
  // A refusal (a filter the API cannot read) keeps the empty table; any other
  // failure throws rather than passing for "no requests".
  requireDataOrRefusal(result, "manual time requests");

  return (
    <div>
      <ManualRequestsTable data={result?.data} canApprove={canApprove} />
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
