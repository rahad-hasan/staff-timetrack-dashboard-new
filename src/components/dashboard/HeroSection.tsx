import weeklyActivityIcon from '../../assets/dashboard/weeklyActivityIcon.svg'
import weeklyWorkIcon from '../../assets/dashboard/weeklyWorkIcon.svg'
import totalProjectIcon from '../../assets/dashboard/totalProjectIcon.svg'
import teamMemberIcon from '../../assets/dashboard/teamMemberIcon.svg'
import { TrendingDown, TrendingUp } from "lucide-react";
import Image from 'next/image';
import teamMemberChart from '../../assets/dashboard/teamMemberChart.svg'
import totalProjectChart from '../../assets/dashboard/totalProjectChart.svg'
import weeklyActivityChart from '../../assets/dashboard/weeklyActivityChart.svg'
import weeklyWorkChart from '../../assets/dashboard/weeklyWorkChart.svg'

const HeroSection = () => {
    const metrics = [
        {
            id: 1,
            icon: weeklyActivityIcon,
            chart: weeklyActivityChart,
            value: "48%",
            title: "Weekly ACTIVITY",
            change: "+1.5%",
            direction: "down",
            note: "last week",
        },
        {
            id: 2,
            icon: weeklyWorkIcon,
            chart: weeklyWorkChart,
            value: "30:31:05",
            title: "Weekly Work",
            change: "+30m",
            direction: "up",
            note: "last week",
        },
        {
            id: 3,
            icon: totalProjectIcon,
            chart: totalProjectChart,
            value: "25",
            title: "Total project",
            change: "-15m",
            direction: "down",
            note: "last week",
        },
        {
            id: 4,
            icon: teamMemberIcon,
            chart: teamMemberChart,
            value: "12",
            title: "Team Member",
            change: "+25m",
            direction: "up",
            note: "last week",
        },
    ];
    return (
        <div className="mb-5 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-5">
            {metrics.map(({ id, icon: Icon, chart, value, title, change, direction, note }) => {
                const isUp = direction === "up";
                const TrendIcon = isUp ? TrendingUp : TrendingDown;
                const trendColor = isUp ? "text-green-500" : "text-red-500";

                return (
                    <div
                        key={id}
                        className="border border-borderColor rounded-2xl w-full dark:border-darkBorder transition-all hover:shadow duration-200"
                    >
                        {/* Card header */}
                        <div className="flex items-center justify-between px-4 py-5 bg-bgPrimary dark:bg-darkPrimaryBg rounded-t-2xl">
                            <div className=' flex items-center gap-3'>
                                <div className='w-10 h-10 border border-borderColor dark:border-darkBorder rounded-lg'>
                                    <Image
                                        src={Icon}
                                        alt="icon"
                                        className="p-1.5 object-contain w-full h-full"
                                    />
                                </div>
                                <div>
                                    <h2 className="text-xl font-medium text-headingTextColor dark:text-darkTextPrimary">{value}</h2>
                                    <h3 className="text-subTextColor dark:text-darkTextSecondary">{title}</h3>
                                </div>
                            </div>

                            <div>
                                <Image src={chart} className=' w-20' width={150} height={150} alt='chart' />
                            </div>
                        </div>

                        {/* Card footer */}
                        <div className="bg-bgSecondary dark:bg-darkSecondaryBg rounded-b-2xl border-t px-4 py-3 flex items-center gap-2">
                            <TrendIcon size={20} className={trendColor} />
                            <p className="text-primary">{change}</p>
                            <p className="text-md text-muted-foreground dark:text-darkTextSecondary">{note}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default HeroSection;