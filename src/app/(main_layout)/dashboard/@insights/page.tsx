import CoreWorkMembers from "@/components/Dashboard/insights/CoreWorkMembers";
import OverallActivityChart from "@/components/Dashboard/insights/OverallActivityChart";
import { Button } from "@/components/ui/button";
import { EllipsisVertical, Info } from "lucide-react";

const Insights = async () => {
    await new Promise((resolve) => setTimeout(resolve, 6000));
    const classificationData = [
        { label: 'Productive', percentage: 9, color: 'bg-[#5db0f1]' },
        { label: 'Offline', percentage: 79, color: 'bg-[#dce3e3]' },
        { label: 'Dull', percentage: 12, color: 'bg-[#ffcb49]' },
    ];

    return (
        <div className=" border border-borderColor dark:border-darkBorder bg-bgSecondary dark:bg-darkPrimaryBg p-3 rounded-[12px] w-full">
            <div className=" flex justify-between items-center">
                <h2 className=" text-base text-headingTextColor sm:text-lg dark:text-darkTextPrimary">INSIGHTS</h2>
                <div className=" flex items-center gap-3">
                    <Button className=" text-sm md:text-base dark:text-darkTextPrimary" variant={'outline2'} size={'sm'}><EllipsisVertical /></Button>
                    <Button className=" text-sm md:text-base" size={'sm'}>View Insights</Button>
                </div>
            </div>

            <div className=" flex gap-2 flex-col sm:flex-row sm:items-center mt-5">
                <div className=" flex items-center gap-3 sm:w-1/2">
                    <h2 className="text-base sm:text-lg text-headingTextColor dark:text-darkTextPrimary">Work time classification</h2>
                    <Info size={18} className=" cursor-pointer" />
                </div>
                <div className=" flex items-center gap-3 sm:w-1/2">
                    <h2 className="text-base sm:text-lg text-headingTextColo dark:text-darkTextPrimary">Overall activity</h2>
                    <Info size={18} className=" cursor-pointer" />
                </div>
            </div>
            <div className=" flex flex-col sm:flex-row gap-5 border-b-2 border-borderColor dark:border-darkBorder">
                <div className=" mt-5 sm:w-1/2">
                    <div className=" flex justify-between">
                        <div className=" mb-4">
                            <p className="text-3xl font-bold text-headingTextColor mr-2 dark:text-darkTextPrimary">9%</p>
                            <p className="text-lg font-medium text-subTextColor dark:text-darkTextSecondary">Productive</p>
                        </div>

                        <div className="space-y-1">
                            {classificationData.map((item) => (
                                <div key={item.label} className="flex items-center text-sm text-subTextColor dark:text-darkTextSecondary">
                                    <span className={`w-2.5 h-2.5 rounded ${item.color} mr-2`}></span>
                                    <span className="w-16">{`${item.percentage}%`}</span>
                                    <span>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex w-full h-6 rounded-md overflow-hidden mt-16">
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
                <div className=" sm:w-1/2 ">
                    <OverallActivityChart></OverallActivityChart>
                </div>
            </div>
            <CoreWorkMembers></CoreWorkMembers>
        </div>
    );
};

export default Insights;