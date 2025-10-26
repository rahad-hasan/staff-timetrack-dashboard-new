import { Info } from "lucide-react";
import GaugeChart from "./GaugeChart";

const Utilization = () => {
    const secondBarValue = 20;
    const secondBarRange = { start: 50, end: 65 };
    return (
        <div className=" border-2 border-borderColor dark:border-darkBorder py-3 px-5 rounded-[12px] w-full">
            <div className=" flex gap-3 items-center">
                <h2 className="text-md sm:text-lg dark:text-darkTextPrimary">Utilization</h2>
                <Info size={18} className=" cursor-pointer" />
            </div>
            <div className=" flex items-center justify-between mt-8 pb-5  border-b  dark:border-darkBorder">
                <div className="">
                    <GaugeChart percentage={65} value="4:38h" label="Daily work avg." />
                </div>
                <div className="">
                    <p className="flex items-center justify-end gap-2 dark:text-darkTextPrimary text-3xl">
                        2:22
                    </p>
                    <p className="flex items-center justify-end gap-2 text-subTextColor dark:text-darkTextSecondary text-lg ">
                        Below target
                    </p>
                    <div className=" flex gap-3 items-center mt-8">
                        <Info size={18} className=" cursor-pointer" />
                        <h2 className="text-md  dark:text-darkTextPrimary">Avg. daily target 8:00</h2>
                    </div>
                </div>
            </div>

            <div className=" flex items-center gap-2 mt-5">
                <span className=" text-subTextColor dark:text-darkTextSecondary">0%</span>
                <div className="relative w-full h-4 bg-[#dce3e3] dark:bg-darkPrimaryBg rounded-full border border-borderColor dark:border-darkBorder my-3">

                    <div
                        className="absolute h-full bg-primary rounded-full"
                        style={{
                            left: `${secondBarRange.start}%`,
                            width: `${secondBarRange.end - secondBarRange.start}%`,
                        }}
                    ></div>

                    <div
                        className="absolute w-4 h-4 bg-primary rounded-full border-4 border-white dark:border-gray-200 shadow-md"
                        style={{
                            left: `${secondBarValue - 1}%`,
                        }}
                    >
                    </div>
                    <span
                        className="absolute bottom-3.5 flex items-center text-textGray dark:text-darkTextSecondary"
                        style={{
                            left: `${secondBarValue - 1.5}%`,
                        }}
                    >{secondBarValue}%</span>
                </div>
                <span className=" text-subTextColor dark:text-darkTextSecondary">100%</span>
            </div>
        </div>
    );
};

export default Utilization;