import { Suspense, type ReactNode } from "react";
import LiveDataBoundary from "@/components/Common/LiveDataBoundary";

/**
 * One panel of the dashboard page: its skeleton until it has rendered, and a
 * failure of its own, which costs only this panel and heals itself.
 *
 * The panels are parts of ONE page, not parallel-route slots. Whenever the
 * router cannot reuse what it holds (a link back to the dashboard, Back or
 * Forward after a refresh, a link into a period it has not shown), Next 15
 * fetches each leaf of a route on a request of its own, and every such request
 * renders the whole route: as eight slots, a return to the dashboard cost
 * eight full renders, 80 API reads. One leaf costs one.
 *
 * - Never a loading.tsx in this route: the router caches loading states, draws
 *   them on a change of period, and fetches the page behind them separately.
 * - The Suspense boundary shows the skeleton on a load or a link in. A change
 *   of period keeps the page mounted (Next keys a page without its query), so
 *   the current panels stay up, with the top loader, until the new ones are
 *   ready. A live refresh does the same.
 * - The boundary around it is the net under the panel's own LiveDataBoundary,
 *   which covers its read. Whatever else fails in the panel is drawn in the
 *   panel's frame too, instead of replacing the whole dashboard (error.tsx).
 */
export default function DashboardPanel({
  title,
  className,
  skeleton,
  children,
}: {
  /** The heading of the panel's failure card. */
  title: string;
  /** The failure card's margins: those of the panel it stands in for. */
  className?: string;
  skeleton: ReactNode;
  children: ReactNode;
}) {
  return (
    <LiveDataBoundary title={title} className={className}>
      <Suspense fallback={skeleton}>{children}</Suspense>
    </LiveDataBoundary>
  );
}
