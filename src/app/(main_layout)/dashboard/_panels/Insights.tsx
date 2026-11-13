import { getDashboardInsights } from '@/actions/dashboard/action';
import LiveDataBoundary from '@/components/Common/LiveDataBoundary';
import Insights from '@/components/Dashboard/insights/Insights';
import {
  parseDashboardTab,
  type DashboardTab,
} from '@/components/Dashboard/dashboardParams';
import { sampleInsights } from '@/lib/sampleData/fixtures';
import { getSampleDataMode } from '@/lib/sampleData/getSampleDataMode';
import { requireLiveData } from '@/lib/server/liveData';
import { ISearchParamsProps } from '@/types/type';

const InsightsServer = async ({ searchParams }: ISearchParamsProps) => {
  const tab = parseDashboardTab((await searchParams).tab);

  // A failed read costs only this panel, and clears on the next tab or sort change.
  return (
    <LiveDataBoundary title="Insights">
      <InsightsPanel tab={tab} />
    </LiveDataBoundary>
  );
};

async function InsightsPanel({ tab }: { tab: DashboardTab }) {
  // The live read starts alongside the sample-data gate, not after it.
  const [sampleMode, result] = await Promise.all([
    getSampleDataMode(),
    getDashboardInsights({ type: tab }),
  ]);

  const data = sampleMode
    ? sampleInsights(tab)
    : requireLiveData(result, "insights");

  return (
    <div>
      <Insights data={data}></Insights>
    </div>
  );
}

export default InsightsServer;
