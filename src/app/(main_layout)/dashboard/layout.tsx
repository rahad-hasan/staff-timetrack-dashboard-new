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
  recentActivity: React.ReactNode;
  insights: React.ReactNode;
  members: React.ReactNode;
  appsAndUrl: React.ReactNode;
  projectListTable: React.ReactNode;
  taskListTable: React.ReactNode;
}>) {
  return (
    <div className="w-full space-y-5">
      {children}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {recentActivity}
        {insights}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {members}
        {appsAndUrl}
      </div>
      {taskListTable}
      {projectListTable}
    </div>
  );
}
