import ManualRequestsSkeleton from "@/skeleton/timesheets/manualRequest/ManualRequestsSkeleton";

// The whole report (header included) is built from one server read, so a
// navigation into it shows a table skeleton at once instead of nothing.
// Filter changes keep the current report on screen while the next one loads.
export default function WorkReportLoading() {
  return <ManualRequestsSkeleton />;
}
