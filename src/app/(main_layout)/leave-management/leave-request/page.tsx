import HeadingComponent from "@/components/Common/HeadingComponent";
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
            <div className="mb-5">
                <HeadingComponent heading="Request Queue" subHeading="Approve or reject tenant leave requests using the backend status workflow."></HeadingComponent>
            </div>
            <Suspense fallback={<LeaveRequestTableSkeleton />}>
                <LeaveRequestServer searchParams={searchParams} />
            </Suspense>
        </div>
    );
};

export default LeaveRequest;
