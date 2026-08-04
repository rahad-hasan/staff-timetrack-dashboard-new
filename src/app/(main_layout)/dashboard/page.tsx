import { Suspense } from "react";
import { getDecodedUser } from "@/utils/decodedLogInUser";

import HeroCart from "./@topCart/page";
import InsightsServer from "./@insights/page";
import CoreWorkMember from "./@recentActivity/page";
import DashboardTaskTableServer from "./@taskListTable/page";
import DashboardMembersTableServer from "./@members/page";
import AppsAndUrlServer from "./@appsAndUrl/page";
import DashboardProjectTableServer from "./@projectListTable/page";

import InsightsSkeleton from "./@insights/loading";
import CoreMembersSkeleton from "./@recentActivity/loading";
import TaskTableSkeleton from "./@taskListTable/loading";
import MembersSkeleton from "./@members/loading";
import AppsSkeleton from "./@appsAndUrl/loading";
import ProjectSkeleton from "./@projectListTable/loading";
import DashboardHeroSkeleton from "./@topCart/loading";

import { ISearchParamsProps } from "@/types/type";

export default async function Dashboard({
  children,
  searchParams,
}: {
  children: React.ReactNode;
} & ISearchParamsProps) {
  const user = await getDecodedUser();
  const role = user?.role;

  const isAllowed =
    role === "admin" ||
    role === "manager" ||
    role === "hr";

  return (
    <div className="w-full">
      {children}

      <Suspense fallback={<DashboardHeroSkeleton />}>
        <HeroCart searchParams={searchParams} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Suspense fallback={<CoreMembersSkeleton />}>
          <CoreWorkMember searchParams={searchParams} />
        </Suspense>

        <Suspense fallback={<InsightsSkeleton />}>
          <InsightsServer searchParams={searchParams} />
        </Suspense>
      </div>

      <Suspense fallback={<TaskTableSkeleton />}>
        <DashboardTaskTableServer />
      </Suspense>

      {isAllowed && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Suspense fallback={<MembersSkeleton />}>
            <DashboardMembersTableServer />
          </Suspense>

          <Suspense fallback={<AppsSkeleton />}>
            <AppsAndUrlServer searchParams={searchParams} />
          </Suspense>
        </div>
      )}

      <Suspense fallback={<ProjectSkeleton />}>
        <DashboardProjectTableServer />
      </Suspense>
    </div>
  );
}