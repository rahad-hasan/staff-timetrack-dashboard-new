import FilterButton from "@/components/Common/FilterButton";
import OverallActivityChart from "@/components/Dashboard/insights/OverallActivityChart";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export interface IDashboardInsight {
    period: string;
    active_duration: string;
    productive: number;
    idle_duration: string;
    percentages: {
        active: number;
        idle: number;
        productive: number;
    };
}
const Insights = async ({ data }: { data: IDashboardInsight }) => {

    const classificationData = [
        { label: "Productive", percentage: data?.percentages?.productive, color: "bg-[#5db0f1]" },
        { label: "Active", percentage: data?.percentages?.active, color: "bg-[#dce3e3]" },
        { label: "Idle", percentage: data?.percentages?.idle, color: "bg-[#ffcb49]" },
    ];

    return (
        <div className="w-full h-full border border-borderColor dark:border-darkBorder dark:bg-darkPrimaryBg p-4 2xl:p-5 rounded-[12px]">
            <div className=" flex justify-between items-center">
                <h2 className=" text-base text-headingTextColor sm:text-lg dark:text-darkTextPrimary">
                    INSIGHTS
                </h2>
                <div className=" flex items-center gap-3">
                    <FilterButton />
                    <Button
                        className="py-[14px] px-[16px] sm:py-[18px] sm:px-[20px] rounded-[8px]"
                        size={"sm"}
                    >
                        View Insights
                    </Button>
                </div>
            </div>

            <div className=" flex gap-2 flex-col sm:flex-row sm:items-center mt-5">
                <div className=" flex items-center gap-3 sm:w-1/2">
                    <h2 className="text-base sm:text-lg text-headingTextColor dark:text-darkTextPrimary">
                        Work time classification
                    </h2>
                    <Info size={18} className=" cursor-pointer" />
                </div>
                <div className=" flex items-center gap-3 sm:w-1/2">
                    <h2 className="text-base sm:text-lg text-headingTextColor dark:text-darkTextPrimary">
                        Overall activity
                    </h2>
                    <Info size={18} className=" cursor-pointer" />
                </div>
            </div>
            <div className=" flex flex-col sm:flex-row gap-5 ">
                <div className=" mt-5 sm:w-1/2 ">
                    <div className=" flex justify-between">
                        <div className=" mb-4">
                            <p className="text-3xl font-bold text-headingTextColor mr-2 dark:text-darkTextPrimary">
                                {data?.percentages?.productive}%
                            </p>
                            <p className="text-lg font-medium text-headingTextColor dark:text-darkTextSecondary">
                                Productive
                            </p>
                        </div>

                        <div className="space-y-1">
                            {classificationData.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex items-center text-sm text-headingTextColor dark:text-darkTextSecondary"
                                >
                                    <span
                                        className={`w-2.5 h-2.5 rounded ${item.color} mr-2`}
                                    ></span>
                                    <span className="">{`${item.percentage}%`}</span>
                                    <span className="ml-1">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="flex w-full h-6 rounded-md overflow-hidden mt-16 ">
                            {classificationData.map((item) => (
                                <div
                                    key={item.label}
                                    style={{ width: `${item.percentage}%` }}
                                    className={`${item.color} h-full`}
                                ></div>
                            ))}
                        </div>
                        <div className=" flex justify-between text-base text-headingTextColor mt-1 px-1 dark:text-darkTextSecondary">
                            <span>1%</span>
                            <span>25%</span>
                            <span>50%</span>
                            <span>75%</span>
                            <span>100%</span>
                        </div>
                    </div>
                </div>
                <div className=" sm:w-1/2 ">
                    <OverallActivityChart data={data}></OverallActivityChart>
                </div>
            </div>

        </div>
    );
};

export default Insights;
