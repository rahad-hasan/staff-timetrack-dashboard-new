
import { Suspense } from "react";
import MonthPicker from "@/components/Common/MonthPicker";
import SelectUserWrapper from "@/components/Common/SelectUserWrapper";
import MonthlyReportServer from "@/components/Insights/Performance/MonthlyReportServer";
import MonthlyReportSkeleton from "@/components/Insights/Performance/MonthlyReportSkeleton";
import { ISearchParamsProps } from "@/types/type";
import { CalendarRange } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Time Tracker Monthly Report",
  description: "Staff Time Tracker Monthly Report",
};

const MonthlyReportPage = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;

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

      {/* The report is read inside the boundary, so a visit, a month change
          or a user switch (a new key) shows the skeleton at once instead of
          freezing the previous report. */}
      <Suspense key={JSON.stringify(params)} fallback={<MonthlyReportSkeleton />}>
        <MonthlyReportServer searchParams={searchParams} />
      </Suspense>
    </div>
  );
};

export default MonthlyReportPage;
