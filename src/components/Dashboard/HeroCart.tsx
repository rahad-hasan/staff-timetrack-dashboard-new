import { TrendingDown, TrendingUp } from "lucide-react";
import WeeklyActivityColoredIcon from '../ColoredIcon/HeroSectionIcon/WeeklyActivityColoredIcon';
import TotalProjectColoredIcon from '../ColoredIcon/HeroSectionIcon/TotalProjectColoredIcon';
import TeamMemberColoredIcon from '../ColoredIcon/HeroSectionIcon/TeamMemberColoredIcon';
import WeeklyWorkColoredIcon from '../ColoredIcon/HeroSectionIcon/WeeklyWorkColoredIcon';
import { IDashboardStats, ISearchParamsProps } from '@/types/type';
import FirstChart from "../Icons/HeadingChartIcon/FirstChart";
import SecondChart from "../Icons/HeadingChartIcon/SecondChart";
import { getDashboardStats } from "@/actions/dashboard/action";

const HeroCart = async ({ searchParams }: ISearchParamsProps) => {
    const params = await searchParams;
    const statsType = params.tab === 'daily' ? 'daily' : (params.tab || 'daily');
    const result = await getDashboardStats({
        type: statsType,
    });

    const data = result?.data?.metrics

    // 1. Create a Mapping for your static assets
    const metricConfig = {
        activity: {
            icon: <WeeklyActivityColoredIcon size={36} />,
        },
        work: {
            icon: <WeeklyWorkColoredIcon size={36} />,
        },
        projects: {
            icon: <TotalProjectColoredIcon size={36} />,
        },
        members: {
            icon: <TeamMemberColoredIcon size={36} />,
        }
    };

    const metrics = (Object.keys(data) as Array<keyof IDashboardStats>).map((key) => {
        const apiData = data[key];
        const config = metricConfig[key];

        return {
            id: key,
            title: apiData?.label,
            value: apiData?.value,
            change: apiData?.change,
            isUp: apiData?.is_improved,
            icon: config?.icon,
            note: params.tab === 'daily' ? 'Yesterday' : params.tab === 'weekly' ? "Last Weekly" : params.tab === 'monthly' ? "Last Month" : "",
        };
    });

    return (
        <div className="mb-5 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-5">
            {metrics.map(({ id, icon, value, title, change, isUp, note }, index) => {
                const TrendIcon = isUp ? TrendingUp : TrendingDown;
                const trendColor = isUp ? "text-[#12cd69]" : "text-[#f40139]";

                return (
                    <div
                        key={id}
                        className="border border-borderColor rounded-2xl w-full dark:border-darkBorder transition-all hover:shadow duration-200 relative h-38"
                    >
                        <div className="flex items-center justify-between px-4 py-5 bg-bgPrimary dark:bg-darkPrimaryBg rounded-t-2xl">
                            <div className='flex items-center gap-3'>
                                <div>{icon}</div>
                                <div>
                                    <h2 className="text-2xl font-medium text-headingTextColor dark:text-darkTextPrimary">{value}</h2>
                                    <h3 className="uppercase text-subTextColor dark:text-darkTextSecondary">{title}</h3>
                                </div>
                            </div>
                            <div>
                                {
                                    isUp ?
                                        <div className="text-green-600">
                                            <FirstChart></FirstChart>
                                        </div>

                                        :
                                        <div className="text-red-600">
                                            <SecondChart></SecondChart>
                                        </div>
                                }
                            </div>
                        </div>

                        <div className="bg-bgSecondary dark:bg-darkSecondaryBg rounded-b-2xl border-t px-4 py-3 flex items-center gap-2 absolute left-0 right-0 bottom-0">
                            <TrendIcon size={20} className={trendColor} />
                            <p className={`${trendColor} font-medium`}>{change}</p>
                            <p className={`text-md text-muted-foreground dark:text-darkTextSecondary`}>{note}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default HeroCart;
