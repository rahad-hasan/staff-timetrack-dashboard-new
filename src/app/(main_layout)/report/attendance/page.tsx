import HeadingComponent from "@/components/Common/HeadingComponent";
import { ISearchParamsProps } from "@/types/type";
import AttendanceListServer from "@/components/Report/Attendance/AttendanceListServer";
import { Suspense } from "react";
import { Metadata } from "next";
import AttendanceTableSkeleton from "@/skeleton/report/Attendance/AttendanceTableSkeleton";

export const metadata: Metadata = {
  title: "Staff Time Tracker Attendance",
  description: "Staff Time Tracker Attendance",
};
const AttendancePage = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
        <HeadingComponent
          heading="Attendance"
          subHeading="All the Attendance during the working hour by team member is here"
        ></HeadingComponent>
      </div>
      <Suspense
        fallback={<AttendanceTableSkeleton />}
        key={JSON.stringify(params)}
      >
        <AttendanceListServer searchParams={searchParams} />
      </Suspense>
    </div>
  );
};

export default AttendancePage;
