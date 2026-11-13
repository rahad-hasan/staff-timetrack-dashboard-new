import { Metadata } from "next";
import { Suspense } from "react";
import HeadingComponent from "@/components/Common/HeadingComponent";
import LeaveCalendarServer from "@/components/LeaveManagement/LeaveCalendarServer";
import { ISearchParamsProps } from "@/types/type";
import CalenderSkeleton from "@/skeleton/event/CalenderSkeleton";

export const metadata: Metadata = {
  title: "Staff Time Tracker Leave Calendar",
  description: "Staff Time Tracker Leave Calendar",
};

const LeaveCalendarPage = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;

  // The reads happen inside the boundary, so a visit, a month change or a
  // user switch (a new key) shows the skeleton at once instead of freezing
  // the previous month.
  return (
    <div className="space-y-5">
      <HeadingComponent
        heading="Leave Calendar"
        subHeading="Follow leave activity month by month with dynamic leave type colors."
      />
      <Suspense fallback={<CalenderSkeleton />} key={JSON.stringify(params)}>
        <LeaveCalendarServer searchParams={searchParams} />
      </Suspense>
    </div>
  );
};

export default LeaveCalendarPage;
