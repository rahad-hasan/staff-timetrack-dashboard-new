import ManualRequestsSkeleton from "@/skeleton/timesheets/manualRequest/ManualRequestsSkeleton";

// The page resolves the viewer's role before it can render its header, so a
// navigation into it shows the table skeleton at once instead of nothing.
export default function ManualRequestsLoading() {
  return <ManualRequestsSkeleton />;
}
