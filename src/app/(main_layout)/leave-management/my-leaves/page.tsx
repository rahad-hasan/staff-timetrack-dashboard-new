import { Metadata } from "next";
import MyLeavesServer from "@/components/LeaveManagement/MyLeaves/MyLeavesServer";
import { ISearchParamsProps } from "@/types/type";
import MyLeaveSkeleton from "@/skeleton/leaveManagement/MyLeaveSkeleton";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Staff Time Tracker My Leaves",
  description: "Staff Time Tracker My Leaves",
};

const MyLeavesPage = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;

  // The reads happen inside the boundary, so a visit, a year change or a
  // user switch (a new key) shows the skeleton at once instead of freezing
  // the previous screen.
  return (
    <Suspense
      fallback={<MyLeaveSkeleton />}
      key={`${JSON.stringify(params.user_id)}:${JSON.stringify(params.year)}`}
    >
      <MyLeavesServer searchParams={searchParams} />
    </Suspense>
  );
};

export default MyLeavesPage;
