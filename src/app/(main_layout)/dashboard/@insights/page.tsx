import { getDashboardInsights } from '@/actions/insights/action';
import Insights from '@/app/(main_layout)/dashboard/@insights/_components/Insights';
import { ISearchParamsProps } from '@/types/type';

const InsightsServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const statsType = params.tab === 'daily' ? 'daily' : (params.tab || 'daily');
  const result = await getDashboardInsights({
    type: statsType,
  });

  return (
    <Insights data={result?.data}></Insights>
  );
};

export default InsightsServer;