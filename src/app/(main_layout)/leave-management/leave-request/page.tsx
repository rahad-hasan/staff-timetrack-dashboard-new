import HeadingComponent from "@/components/Common/HeadingComponent";
import LeaveRequestHeading from "@/components/LeaveManagement/LeaveRequest/LeaveRequestHeading";
import LeaveRequestServer from "@/components/LeaveManagement/LeaveRequest/LeaveRequestServer";

import LeaveRequestTableSkeleton from "@/skeleton/leaveManagement/LeaveRequestTableSkeleton";
import { ISearchParamsProps } from "@/types/type";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Staff Time Tracker Leave Request",
    description: "Staff Time Tracker Leave Request",
};
const LeaveRequest = async ({ searchParams }: ISearchParamsProps) => {

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <HeadingComponent heading="Leave Management" subHeading="All the teams member leave details are displayed here"></HeadingComponent>
                <LeaveRequestHeading></LeaveRequestHeading>
            </div>
            <Suspense fallback={<LeaveRequestTableSkeleton />}>
                <LeaveRequestServer searchParams={searchParams} />
            </Suspense>
        </div>
    );
};

export default LeaveRequest;