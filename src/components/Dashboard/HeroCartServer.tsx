import { ISearchParamsProps } from '@/types/type';
import HeroCart from './HeroCart';
import { getDashboardStats } from '@/actions/dashboard/action';

const HeroCartServer = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const statsType = params.tab === 'daily' ? 'today' : (params.tab || 'today');
    const result = await getDashboardStats({
        type: statsType,
    });
    console.log(result);
    return (
        <>
            <HeroCart data={result?.data?.metrics}></HeroCart>
        </>
    );
};

export default HeroCartServer;