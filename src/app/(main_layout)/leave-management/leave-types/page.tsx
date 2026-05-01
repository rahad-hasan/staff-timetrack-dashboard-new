import { Suspense } from "react";
import { Metadata } from "next";
import HeadingComponent from "@/components/Common/HeadingComponent";
import LeaveTypesServer from "@/components/LeaveManagement/LeaveTypes/LeaveTypesServer";
import { ISearchParamsProps } from "@/types/type";
import LeaveTypeSubNav from "@/components/LeaveManagement/LeaveTypeSubNav";
import LeaveTypesSkeleton from "@/skeleton/leaveManagement/LeaveTypesSkeleton";

export const metadata: Metadata = {
  title: "Staff Time Tracker Leave Types",
  description: "Staff Time Tracker Leave Types",
};

const LeaveTypesPage = ({ searchParams }: ISearchParamsProps) => {
  return (
    <div>
      <div className="mb-5">
        <HeadingComponent
          heading="Leave Types"
          subHeading="Create, refine, retire, and inspect tenant leave policies for the current workspace."
        />
        <LeaveTypeSubNav/>
      </div>
      <Suspense fallback={<LeaveTypesSkeleton />}>
        <LeaveTypesServer searchParams={searchParams} />
      </Suspense>
    </div>
  );
};

export default LeaveTypesPage;
