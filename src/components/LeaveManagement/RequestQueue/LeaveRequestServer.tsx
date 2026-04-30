import { getLeave } from "@/actions/leaves/action";
import { getMembersDashboard } from "@/actions/members/action";
import AppPagination from "@/components/Common/AppPagination";
import { ISearchParamsProps } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import LeaveRequestTable from "./LeaveRequestTable";

const LeaveRequestServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const currentUser = await getDecodedUser();
  const canManageUsers = ["admin", "manager", "hr"].includes(currentUser?.role ?? "");
  const canTakeAction = ["admin", "hr"].includes(currentUser?.role ?? "");

  const approved =
    params.approved === "true" ? true : canManageUsers ? false : undefined;
  const rejected =
    params.rejected === "true" ? true : canManageUsers ? false : undefined;

  const [leaveResponse, membersResponse] = await Promise.all([
    getLeave({
      search: params.search,
      page: params.page,
      user_id: canManageUsers ? params.user_id : undefined,
      approved,
      rejected,
    }),
    canManageUsers ? getMembersDashboard() : Promise.resolve(null),
  ]);

  const users =
    membersResponse?.data?.map((member) => ({
      id: String(member.id),
      label: member.name,
      avatar: member.image ?? "",
    })) ?? [];

    console.log(leaveResponse)

  return (
    <>
      <LeaveRequestTable
        data={leaveResponse?.data ?? []}
        canManageUsers={canManageUsers}
        canTakeAction={canTakeAction}
        users={users}
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
