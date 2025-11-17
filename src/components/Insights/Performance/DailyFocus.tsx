import { Info } from "lucide-react";

const DailyFocus = () => {
    const secondBarValue = 20;
    const secondBarRange = { start: 50, end: 65 };

    const percentage = 75;
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    return (
        <div className=" border border-borderColor dark:border-darkBorder bg-bgSecondary dark:bg-darkPrimaryBg py-3 px-5 rounded-[12px] w-full">
            <div className=" flex gap-3 items-center">
                <h2 className="text-base sm:text-lg text-headingTextColor dark:text-darkTextPrimary">Daily Focus</h2>
                <Info size={18} className=" cursor-pointer" />
            </div>
            <div className=" flex items-center justify-between mt-8 pb-5 border-b dark:border-darkBorder">
                <div className="">
                    <div className=" mb-2">
                        <h2 className=" text-xl font-semibold text-headingTextColor dark:text-darkTextPrimary">2:22</h2>
                        <p className="text-headingTextColor dark:text-darkTextPrimary">Focus time</p>
                    </div>
                    <div className=" mb-2">
                        <h2 className=" text-xl font-semibold text-headingTextColor dark:text-darkTextPrimary">2:22</h2>
                        <p className="text-headingTextColor dark:text-darkTextPrimary">Focus sessions</p>
                    </div>
                    <div className=" mb-2">
                        <h2 className=" text-xl font-semibold text-headingTextColor dark:text-darkTextPrimary">2:22</h2>
                        <p className="text-headingTextColor dark:text-darkTextPrimary">Avg. session length</p>
                    </div>
                </div>
                <div className="">
                    <div className="relative w-38 h-38">
                        <svg className="w-full h-full" viewBox="0 0 150 150">
                            <circle
                                className="text-[#dce3e3]"
                                strokeWidth="12"
                                stroke="currentColor"
                                fill="transparent"
                                r={radius}
                                cx="75"
                                cy="75"
                            />
                            <circle
                                className="text-green-500 transition-all duration-700 ease-in-out"
                                strokeWidth="12"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r={radius}
                                cx="75"
                                cy="75"
                                transform="rotate(-90 75 75)"
                            />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl font-semibold text-green-500">
                                {percentage}%
                            </span>
                        </div>
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
                        className="absolute bottom-3.5 flex items-center text-subTextColor dark:text-darkTextSecondary"
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

export default DailyFocus;