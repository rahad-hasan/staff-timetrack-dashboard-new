"use client";

import AutoRecoveringError from "@/components/Common/AutoRecoveringError";

/**
 * The net under the dashboard page. Each panel has a nearer boundary of its
 * own (DashboardPanel), which draws a failure at the panel's size and leaves
 * the others up; this one catches the rest (the sample-data banner, the
 * page's own render) and heals itself once the API answers again (see
 * useErrorAutoRecovery).
 */
export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <AutoRecoveringError reset={reset} />;
}
