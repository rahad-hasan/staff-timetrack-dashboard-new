
import { getMonthlyWorkReport } from "@/actions/insights/action";
import MonthPicker from "@/components/Common/MonthPicker";
import SelectUserWrapper from "@/components/Common/SelectUserWrapper";
import PerformanceCharts from "@/components/Insights/Performance/PerformanceCharts";
import { ISearchParamsProps } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import { format } from "date-fns";
import { CalendarRange } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Time Tracker Monthly Report",
  description: "Staff Time Tracker Monthly Report",
};

const resolveTargetMonth = async (
  searchParams: ISearchParamsProps["searchParams"],
) => {
  const params = await searchParams;
  const today = new Date();
  const startMonth =
    typeof params.start_month === "string" ? params.start_month : undefined;
  const directMonth =
    typeof params.month === "string" ? params.month : undefined;
  const directYear = typeof params.year === "string" ? params.year : undefined;


  if (startMonth) {
    const parsed = new Date(startMonth);

    if (!Number.isNaN(parsed.getTime())) {
      return {
        params,
        month: format(parsed, "MM"),
        year: format(parsed, "yyyy"),
      };
    }
  }

  return {
    params,
    month: directMonth || format(today, "MM"),
    year: directYear || format(today, "yyyy"),
  };
};

const MonthlyReportPage = async ({ searchParams }: ISearchParamsProps) => {
  const user = await getDecodedUser();
  const { params, month, year } = await resolveTargetMonth(searchParams);
  const targetUserId = params.user_id ?? String(user?.id ?? "");

  const response = await getMonthlyWorkReport({
    user_id: targetUserId,
    month,
    year,
  });

  const report = response?.data;

  return (
    <div className="space-y-6">
      <div className="rounded-[12px] border border-borderColor/70 bg-white px-4 py-4 dark:border-darkBorder dark:bg-darkSecondaryBg sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <CalendarRange className="size-3.5" />
              Monthly reporting
            </div>
            <p className="mt-3 text-sm leading-6 text-subTextColor dark:text-darkTextSecondary">
              Review one user’s full-month attendance, tracked work, project
              distribution, leave, holidays, and anomaly signals from the
              consolidated monthly report endpoint.
            </p>
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex flex-wrap gap-3">
              <MonthPicker />
            </div>
            <SelectUserWrapper defaultSelect />
          </div>
        </div>
      </div>

      {report ? (
        <PerformanceCharts data={report} />
      ) : (
        <div className="rounded-[12px] border border-dashed border-borderColor bg-white p-8 text-center text-sm text-subTextColor  dark:border-darkBorder dark:bg-darkSecondaryBg dark:text-darkTextSecondary">
          {response?.message ||
            "Monthly report data is not available for the selected user and month."}
        </div>
      )}
    </div>
  );
};

export default MonthlyReportPage;
