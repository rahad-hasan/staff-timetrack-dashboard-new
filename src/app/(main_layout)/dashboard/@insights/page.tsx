import { getDashboardInsights } from '@/actions/dashboard/action';
import Insights from '@/components/Dashboard/insights/Insights';
import { sampleInsights } from '@/lib/sampleData/fixtures';
import { getSampleDataMode } from '@/lib/sampleData/getSampleDataMode';
import { ISearchParamsProps } from '@/types/type';

const InsightsServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const statsType = params.tab === 'daily' ? 'daily' : (params.tab || 'daily');

  const sampleMode = await getSampleDataMode();
  const result = sampleMode
    ? null
    : await getDashboardInsights({
      type: statsType,
    });

  const data = sampleMode ? sampleInsights(String(statsType)) : result?.data;

  return (
    <div>
      <Insights data={data}></Insights>
    </div>
  );
};

export default InsightsServer;