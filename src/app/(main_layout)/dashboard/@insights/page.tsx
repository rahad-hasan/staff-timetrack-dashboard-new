import { getDashboardInsights } from '@/actions/dashboard/action';
import Insights from '@/components/Dashboard/insights/Insights';
import { ISearchParamsProps } from '@/types/type';

const InsightsServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const result = await getDashboardInsights({
    type: params.tab,
  });

  return (
    <div>
      <Insights data={result?.data}></Insights>
    </div>
  );
};

export default InsightsServer;