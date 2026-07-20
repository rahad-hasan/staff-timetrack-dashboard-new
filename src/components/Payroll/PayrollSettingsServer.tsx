import {
  getPayrollSummary,
  listEligibleUsers,
  listPayrollProfiles,
} from "@/actions/payroll/action";
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

  const [profilesResponse, summaryResponse, eligibleResponse, rosterResponse] =
    await Promise.all([
      listPayrollProfiles({
        page: currentPage,
        limit: 25,
        is_active:
          tab === "active" ? true : tab === "inactive" ? false : isActiveParam,
      }),
      getPayrollSummary(),
      // Setup queue for the "Not configured" tab — active users only,
      // paginated server-side with an accurate meta.total.
      listEligibleUsers({
        has_profile: false,
        page: tab === "not-configured" ? currentPage : 1,
        limit: 25,
      }),
      // Roster for the "Add payroll profile" dialog: every active user still
      // without an active profile, independent of the tab's pagination.
      listEligibleUsers({ has_profile: false, limit: 200 }),
    ]);

  const profiles =
    profilesResponse?.success && Array.isArray(profilesResponse.data)
      ? profilesResponse.data
      : [];

  const summary = summaryResponse?.success ? summaryResponse.data : null;

  const eligibleUsers =
    eligibleResponse?.success && Array.isArray(eligibleResponse.data)
      ? eligibleResponse.data
      : [];

  const setupRoster =
    rosterResponse?.success && Array.isArray(rosterResponse.data)
      ? rosterResponse.data
      : [];

  return (
    <PayrollSettingsBoard
      profiles={profiles}
      summary={summary}
      eligibleUsers={eligibleUsers}
      eligibleMeta={
        eligibleResponse?.meta ?? {
          page: 1,
          limit: 25,
          total: eligibleUsers.length,
          totalPages: 1,
        }
      }
      setupRoster={setupRoster}
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
