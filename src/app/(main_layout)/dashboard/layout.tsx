
export default function DashboardLayout({
    children,
    recentActivity,
    insights,
    members,
    appsAndUrl,
    projectListTable,
    taskListTable,
}: Readonly<{
    children: React.ReactNode;
    recentActivity: React.ReactNode,
    insights: React.ReactNode,
    members: React.ReactNode,
    appsAndUrl: React.ReactNode,
    projectListTable: React.ReactNode,
    taskListTable: React.ReactNode,
}>) {
    return (
        <div
            className={` w-full`}
        >
            {children}
            <div className="flex flex-col lg:flex-row gap-5 mb-5">
                {recentActivity}
                {insights}
            </div>

            <div className="flex flex-col lg:flex-row gap-5 ">
                {members}
                {appsAndUrl}
            </div>
            {taskListTable}
            {projectListTable}
        </div>
    );
}
