import {
  getPayrollSummary,
  listEligibleUsers,
  listPayrollProfiles,
} from "@/actions/payroll/action";
import { getCompanyInfo } from "@/actions/settings/action";
import { ISearchParamsProps } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import { currencies } from "@/utils/CurrencyList";
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
  const search = typeof params.search === "string" ? params.search.trim() : "";

  const [profilesResponse, summaryResponse, eligibleResponse, rosterResponse, companyResponse] =
    await Promise.all([
      listPayrollProfiles({
        page: currentPage,
        limit: 25,
        search: search || undefined,
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
        search: search || undefined,
      }),
      // Roster for the "Add payroll profile" dialog: every active user still
      // without an active profile, independent of the tab's pagination.
      listEligibleUsers({ has_profile: false, limit: 200 }),
      // The company's zone and currency, for the profile dialog. The layout
      // issues this very GET: rendered together (a hard load, a refresh, a
      // write's re-render) the two share one request; a navigation that
      // renders only this page makes it once.
      getCompanyInfo(),
    ]);

  // Optional: without it the dialog falls back, so it is not among the reads
  // whose failure fails the board.
  const company = companyResponse?.success ? companyResponse.data : null;
  // Only a currency the dialog's list offers: its select would show nothing
  // for any other, and still send it.
  const companyCurrency = company?.currency?.toUpperCase();
  const defaultCurrency =
    companyCurrency && currencies.some((item) => item.value === companyCurrency)
      ? companyCurrency
      : "USD";

  // A failed read is not an empty workspace: the board shows an error that
  // retries by itself instead of "No payroll profiles yet" and zero counts.
  // Not thrown into an error boundary: that would replace the whole board,
  // and with it a profile dialog someone is typing in.
  const loadFailed = [
    profilesResponse,
    summaryResponse,
    eligibleResponse,
    rosterResponse,
  ].some((response) => !response?.success);

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
      search={search}
      // The dialog sends the currency it shows, which overrides the API's own
      // default (the company's): a hardcoded "USD" put a USD profile on every
      // employee of a company paying in another currency unless it was changed.
      currency={defaultCurrency}
      companyTimeZone={company?.time_zone || null}
      loadFailed={loadFailed}
    />
  );
};

export default PayrollSettingsServer;
