"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import Image from 'next/image';
import teamMemberChart from '../../assets/dashboard/teamMemberChart.svg'
import totalProjectChart from '../../assets/dashboard/totalProjectChart.svg'
import weeklyActivityChart from '../../assets/dashboard/weeklyActivityChart.svg'
import weeklyWorkChart from '../../assets/dashboard/weeklyWorkChart.svg'
import darkProjectChart from '../../assets/dashboard/darkProjectChart.svg'
import darkTeamChart from '../../assets/dashboard/darkTeamChart.svg'
import darkWeeklyChart from '../../assets/dashboard/darkWeeklyChart.svg'
import darkWeeklyWorkChart from '../../assets/dashboard/darkWeeklyWorkChart.svg'
import { useTheme } from 'next-themes';
import WeeklyActivityColoredIcon from '../ColoredIcon/HeroSectionIcon/WeeklyActivityColoredIcon';
import TotalProjectColoredIcon from '../ColoredIcon/HeroSectionIcon/TotalProjectColoredIcon';
import TeamMemberColoredIcon from '../ColoredIcon/HeroSectionIcon/TeamMemberColoredIcon';
import WeeklyWorkColoredIcon from '../ColoredIcon/HeroSectionIcon/WeeklyWorkColoredIcon';
import { IDashboardStats } from '@/types/type';

const HeroCart = ({ data }: { data: IDashboardStats }) => {
    const { theme } = useTheme();

    // 1. Create a Mapping for your static assets
    const metricConfig = {
        activity: {
            icon: <WeeklyActivityColoredIcon size={36} />,
            lightChart: weeklyActivityChart,
            darkChart: darkWeeklyChart,
        },
        work: {
            icon: <WeeklyWorkColoredIcon size={36} />,
            lightChart: weeklyWorkChart,
            darkChart: darkWeeklyWorkChart,
        },
        projects: {
            icon: <TotalProjectColoredIcon size={36} />,
            lightChart: totalProjectChart,
            darkChart: darkProjectChart,
        },
        members: {
            icon: <TeamMemberColoredIcon size={36} />,
            lightChart: teamMemberChart,
            darkChart: darkTeamChart,
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
            chart: theme === 'dark' ? config.darkChart : config.lightChart,
            note: "last week",
        };
    });

    return (
        <div className="mb-5 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-5">
            {metrics.map(({ id, icon, chart, value, title, change, isUp, note }) => {
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
                                <Image src={chart} className='w-18 2xl:w-20' width={150} height={150} alt='chart' />
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
