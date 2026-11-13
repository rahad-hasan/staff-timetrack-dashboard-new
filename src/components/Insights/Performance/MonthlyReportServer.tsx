import { format, isValid, parseISO } from "date-fns";
import { getMonthlyWorkReport } from "@/actions/insights/action";
import { getViewerTimeZone } from "@/lib/server/session";
import { todayIn } from "@/lib/timezone";
import { ISearchParamsProps } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import PerformanceCharts from "./PerformanceCharts";

type Params = Awaited<ISearchParamsProps["searchParams"]>;

const resolveTargetMonth = async (params: Params) => {
  // `start_month` is a date-only string ("2026-11-01"): parseISO reads it as
  // a local date. `new Date()` read it as UTC midnight, which is still the
  // previous month in any zone west of UTC.
  const startMonth =
    typeof params.start_month === "string" ? parseISO(params.start_month) : null;

  if (startMonth && isValid(startMonth)) {
    return { month: format(startMonth, "MM"), year: format(startMonth, "yyyy") };
  }

  // The viewer's current month, not the server's.
  const today = todayIn(await getViewerTimeZone());
  return {
    month: (typeof params.month === "string" && params.month) || today.slice(5, 7),
    year: (typeof params.year === "string" && params.year) || today.slice(0, 4),
  };
};

const MonthlyReportServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const [user, { month, year }] = await Promise.all([
    getDecodedUser(),
    resolveTargetMonth(params),
  ]);
  const targetUserId =
    typeof params.user_id === "string" ? params.user_id : String(user?.id ?? "");

  const response = await getMonthlyWorkReport({
    user_id: targetUserId,
    month,
    year,
  });

  const report = response?.data;

  return report ? (
    <PerformanceCharts data={report} />
  ) : (
    <div className="rounded-[12px] border border-dashed border-borderColor bg-white p-8 text-center text-sm text-subTextColor  dark:border-darkBorder dark:bg-darkSecondaryBg dark:text-darkTextSecondary">
      {response?.message ||
        "Monthly report data is not available for the selected user and month."}
    </div>
  );
};

export default MonthlyReportServer;
