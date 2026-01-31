import { cookies } from "next/headers";

export default async function DashboardLayout({
  children,
  topCart,
  recentActivity,
  insights,
  members,
  appsAndUrl,
  projectListTable,
  taskListTable,
}: Readonly<{
  children: React.ReactNode;
  topCart: React.ReactNode;
  recentActivity: React.ReactNode;
  insights: React.ReactNode;
  members: React.ReactNode;
  appsAndUrl: React.ReactNode;
  projectListTable: React.ReactNode;
  taskListTable: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const role = cookieStore.get("staffTimeDashboardRole")?.value;

  return (
    <div className="w-full">
      {children}
      {topCart}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {recentActivity}
        {insights}
      </div>
      {taskListTable}

      {
        (role === 'admin' ||
          role === 'manager' ||
          role === 'hr') &&
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {members}
          {appsAndUrl}
        </div>
      }

      {projectListTable}
    </div>
  );
}
