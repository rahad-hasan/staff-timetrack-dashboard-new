import { Metadata } from "next";
import { Suspense } from "react";

import HeadingComponent from "@/components/Common/HeadingComponent";
import HolidayManagementServer from "@/components/LeaveManagement/Holidays/HolidayManagementServer";
import LeaveManagementSubNav from "@/components/LeaveManagement/LeaveManagementSubNav";
import LeaveDetailsSkeleton from "@/skeleton/leaveManagement/leaveDetailsSkeleton";
import { ISearchParamsProps } from "@/types/type";

export const metadata: Metadata = {
  title: "Staff Time Tracker Holidays",
  description: "Staff Time Tracker Holidays",
};

const HolidaysPage = ({ searchParams }: ISearchParamsProps) => {
  return (
    <div>
      <div className="mb-5">
        <HeadingComponent
          heading="Holidays"
          subHeading="Review the workspace holiday registry. Admin and HR can create, update, delete, and import company or public holidays."
        />
        <LeaveManagementSubNav />
      </div>

      <Suspense fallback={<LeaveDetailsSkeleton />}>
        <HolidayManagementServer searchParams={searchParams} />
      </Suspense>
    </div>
  );
};

export default HolidaysPage;
