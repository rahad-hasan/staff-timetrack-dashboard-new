import AppsAndUrl from "@/components/dashboard/AppsAndUrl";
import Insights from "@/components/dashboard/Insights";
import Members from "@/components/dashboard/Members";
import ProjectListTable from "@/components/dashboard/ProjectListTable";
import TaskListTable from "@/components/dashboard/TaskListTable";

export default function DashboardLayout({
    children,
    recentActivity,
}: Readonly<{
    children: React.ReactNode;
    recentActivity: React.ReactNode,
}>) {
    return (
        <div
            className={` w-full`}
        >

            {children}
            <div className="flex gap-5 mb-5">
                {recentActivity}
                <Insights></Insights>
            </div>

            <div className="flex gap-5 ">
                <Members></Members>
                <AppsAndUrl></AppsAndUrl>
            </div>
            <TaskListTable></TaskListTable>
            <ProjectListTable></ProjectListTable>
        </div>
    );
}
