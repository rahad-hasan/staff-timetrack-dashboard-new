import { Metadata } from "next";
import HeadingComponent from "@/components/Common/HeadingComponent";
import LeaveHistoryServer from "@/components/LeaveManagement/LeaveHistory/LeaveHistoryServer";
import { ISearchParamsProps } from "@/types/type";
import HistorySkeleton from "@/skeleton/leaveManagement/HistorySkeleton";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Staff Time Tracker Leave History",
  description: "Staff Time Tracker Leave History",
};

const LeaveHistoryPage = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;

  // The reads happen inside the boundary, so a visit or a filter change (a new
  // key) shows the skeleton at once instead of freezing the previous screen.
  return (
    <div className="space-y-5">
      <HeadingComponent
        heading="Leave History"
        subHeading="Audit leave decisions with employee, date range, and status filters."
      />
      <Suspense fallback={<HistorySkeleton />} key={JSON.stringify(params)}>
        <LeaveHistoryServer searchParams={searchParams} />
      </Suspense>
    </div>
  );
};

export default LeaveHistoryPage;
