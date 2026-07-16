import { listPayrollProfiles } from "@/actions/payroll/action";
import { getMembers } from "@/actions/members/action";
import { ISearchParamsProps } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import { canManagePayroll } from "@/lib/payroll";
import PayrollAccessDenied from "./PayrollAccessDenied";
import PayrollSettingsBoard from "./PayrollSettingsBoard";

const parseBool = (value: unknown): boolean | undefined => {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

const PayrollSettingsServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const currentUser = await getDecodedUser();

  if (!canManagePayroll(currentUser?.role)) {
    return <PayrollAccessDenied />;
  }

  const currentPage =
    typeof params.page === "string" ? Number(params.page) || 1 : 1;
  const isActiveParam = parseBool(params.is_active);
  const tab = typeof params.tab === "string" ? params.tab : "all";

  const [profilesResponse, membersResponse] = await Promise.all([
    listPayrollProfiles({
      page: currentPage,
      limit: 25,
      is_active:
        tab === "active" ? true : tab === "inactive" ? false : isActiveParam,
    }),
    getMembers({ limit: 500 }),
  ]);

  const profiles =
    profilesResponse?.success && Array.isArray(profilesResponse.data)
      ? profilesResponse.data
      : [];

  const members =
    membersResponse?.success && Array.isArray(membersResponse.data)
      ? membersResponse.data
      : [];

  return (
    <PayrollSettingsBoard
      profiles={profiles}
      members={members}
      meta={
        profilesResponse?.meta ?? {
          page: 1,
          limit: 25,
          total: profiles.length,
          totalPages: 1,
        }
      }
      tab={tab}
      currency={currentUser?.email ? "USD" : "USD"}
    />
  );
};

export default PayrollSettingsServer;
