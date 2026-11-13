import { Suspense } from "react";
import LiveRefresh from "@/components/Common/LiveRefresh";
import SampleDataBanner from "@/components/Dashboard/SampleDataBanner";
import { MANAGEMENT_ROLES, hasRole } from "@/lib/roles";
import { getSampleDataMode } from "@/lib/sampleData/getSampleDataMode";
import AppsAndUrlSkeleton from "@/skeleton/dashboard/AppsAndUrlSkeleton";
import CoreWorkMembersSkeleton from "@/skeleton/dashboard/CoreWorkMembersSkeleton";
import DashboardHeroSkeleton from "@/skeleton/dashboard/DashboardHeroSkeleton";
import DashboardMembersSkeleton from "@/skeleton/dashboard/DashboardMembersSkeleton";
import InsightsSkeleton from "@/skeleton/dashboard/InsightsSkeleton";
import ProjectListSkeleton from "@/skeleton/dashboard/ProjectListSkeleton";
import TaskListSkeleton from "@/skeleton/dashboard/TaskListSkeleton";
import type { ISearchParamsProps } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import AppsAndUrl from "./_panels/AppsAndUrl";
import CoreWorkMembers from "./_panels/CoreWorkMembers";
import DashboardPanel from "./_panels/DashboardPanel";
import Insights from "./_panels/Insights";
import Members from "./_panels/Members";
import Overview from "./_panels/Overview";
import ProjectList from "./_panels/ProjectList";
import TaskList from "./_panels/TaskList";

/**
 * The dashboard: seven panels of one page, each loading and failing on its
 * own (see DashboardPanel for why they are not parallel-route slots).
 *
 * The live refresh is rendered by the page, never by a layout: its stamp must
 * date the panels, and the router refetches or restores a page without its
 * layouts (see LiveRefresh).
 *
 * Only the viewer's role is awaited here, the session read the shell above
 * has already made for this request. Everything slower resolves inside a
 * Suspense boundary: awaited by the page itself, the sample-data gate (up to
 * three API calls) held back the whole dashboard, because nothing between
 * this page and the root renders a loading boundary.
 */
export default async function Dashboard({ searchParams }: ISearchParamsProps) {
  const user = await getDecodedUser();

  return (
    <div className="w-full">
      <LiveRefresh section="dashboard" />
      <Suspense fallback={null}>
        <SampleBanner />
      </Suspense>

      <DashboardPanel title="Dashboard" className="mb-5" skeleton={<DashboardHeroSkeleton />}>
        <Overview searchParams={searchParams} />
      </DashboardPanel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DashboardPanel title="Core work members" skeleton={<CoreWorkMembersSkeleton />}>
          <CoreWorkMembers searchParams={searchParams} />
        </DashboardPanel>
        <DashboardPanel title="Insights" skeleton={<InsightsSkeleton />}>
          <Insights searchParams={searchParams} />
        </DashboardPanel>
      </div>

      <DashboardPanel title="Task list" className="my-5" skeleton={<TaskListSkeleton />}>
        <TaskList />
      </DashboardPanel>

      {hasRole(MANAGEMENT_ROLES, user?.role) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <DashboardPanel title="Members" skeleton={<DashboardMembersSkeleton />}>
            <Members />
          </DashboardPanel>
          <DashboardPanel title="Apps & URL" skeleton={<AppsAndUrlSkeleton />}>
            <AppsAndUrl searchParams={searchParams} />
          </DashboardPanel>
        </div>
      )}

      <DashboardPanel title="Project list" className="mt-5" skeleton={<ProjectListSkeleton />}>
        <ProjectList />
      </DashboardPanel>
    </div>
  );
}

async function SampleBanner() {
  return (await getSampleDataMode()) ? <SampleDataBanner /> : null;
}
