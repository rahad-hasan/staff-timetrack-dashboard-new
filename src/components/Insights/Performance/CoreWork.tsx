import { Info } from "lucide-react";

const CoreWork = () => {
    const activePeriods = [
        { start: 0, end: 7 },
    ];
    const secondBarValue = 20;
    const secondBarRange = { start: 50, end: 65 };

    return (
        <div className=" border-2 border-borderColor dark:border-darkBorder py-3 px-5 rounded-[12px] w-full">
            <div className=" flex gap-3 items-center mb-8">
                <h2 className="text-base sm:text-lg text-headingTextColor dark:text-darkTextPrimary">Work time classification</h2>
                <Info size={18} className=" cursor-pointer" />
            </div>
            <div className=" flex items-center justify-between mb-8">
                <div className="">
                    <p className="text-3xl text-headingTextColor mr-2 dark:text-darkTextPrimary">20%</p>
                    <p className="text-lg text-subTextColor dark:text-darkTextSecondary">Core work</p>
                </div>
                <div className="">
                    <p className="flex items-center gap-2 text-headingTextColor dark:text-darkTextPrimary">
                        <span className="w-3 h-3 rounded-full bg-primary "></span>
                        20% Core work
                    </p>
                    <p className="flex items-center gap-2 text-headingTextColor dark:text-darkTextPrimary">
                        <span className="w-3 h-3 rounded-full bg-[#dce3e3] "></span>
                        93% Non-core work
                    </p>
                </div>
            </div>
            <div className="relative h-8 bg-[#dce3e3] dark:bg-darkPrimaryBg rounded-lg border border-borderColor dark:border-darkBorder">
                {activePeriods.map((period, index) => {
                    const startPercent = (period.start / 24) * 100;
                    const endPercent = (period.end / 24) * 100;
                    const width = endPercent - startPercent;

                    return (
                        <div
                            key={index}
                            className="absolute h-8 bg-primary rounded-l-lg"
                            style={{
                                left: `${startPercent}%`,
                                width: `${width}%`,
                            }}
                        ></div>
                    );
                })}
            </div>
            <div className="flex justify-between mt-[2px] border-b  dark:border-darkBorder pb-5">
                {["1%", "25%", "50%", "75%", "100%"].map((label, i) => (
                    <span
                        key={i}
                        className="text-sm text-subTextColor dark:text-darkTextSecondary"
                    >
                        {label}
                    </span>
                ))}
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

export default CoreWork;