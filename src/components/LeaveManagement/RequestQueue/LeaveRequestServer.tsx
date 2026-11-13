import { getLeave } from "@/actions/leaves/action";
import { getMembersDashboard } from "@/actions/members/action";
import AppPagination from "@/components/Common/AppPagination";
import { canManageLeave, canViewTeamLeave, toUserOptions } from "@/lib/leave";
import { ISearchParamsProps } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import LeaveRequestTable from "./LeaveRequestTable";

const LeaveRequestServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const currentUser = await getDecodedUser();
  const canManageUsers = canViewTeamLeave(currentUser?.role);
  const canTakeAction = canManageLeave(currentUser?.role);

  const approved =
    params.approved === "true" ? true : canManageUsers ? false : undefined;
  const rejected =
    params.rejected === "true" ? true : canManageUsers ? false : undefined;

  const [leaveResponse, membersResponse] = await Promise.all([
    getLeave({
      search: typeof params.search === "string" ? params.search : undefined,
      page: typeof params.page === "string" ? params.page : undefined,
      user_id:
        canManageUsers && typeof params.user_id === "string"
          ? params.user_id
          : undefined,
      approved,
      rejected,
    }),
    canManageUsers ? getMembersDashboard() : Promise.resolve(null),
  ]);

  return (
    <>
      <LeaveRequestTable
        data={leaveResponse?.data ?? []}
        canManageUsers={canManageUsers}
        canTakeAction={canTakeAction}
        users={toUserOptions(membersResponse?.data)}
        total={leaveResponse?.meta?.total}
      />
      <AppPagination
        total={(leaveResponse?.meta?.total as number) ?? 1}
        currentPage={Number(params.page) || 1}
        limit={(leaveResponse?.meta?.limit as number) ?? 10}
      />
    </>
  );
};

export default LeaveRequestServer;
