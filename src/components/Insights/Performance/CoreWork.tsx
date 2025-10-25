import { Info } from "lucide-react";

const CoreWork = () => {
    const activePeriods = [
        { start: 0, end: 7 },
    ];

    return (
        <div className=" border-2 border-borderColor dark:border-darkBorder py-3 px-5 rounded-[12px] w-full">
            <div className=" flex gap-3 items-center mb-5">
                <h2 className="text-md sm:text-lg dark:text-darkTextPrimary">Work time classification</h2>
                <Info size={18} className=" cursor-pointer" />
            </div>
            <div className=" flex items-center justify-between mb-5">
                <div className="">
                    <p className="text-3xl text-headingTextColor mr-2 dark:text-darkTextPrimary">20%</p>
                    <p className="text-lg text-subTextColor dark:text-darkTextSecondary">Core work</p>
                </div>
                <div className="">
                    <p className="flex items-center gap-2 dark:text-darkTextPrimary">
                        <span className="w-3 h-3 rounded-full bg-primary "></span>
                        20% Core work
                    </p>
                    <p className="flex items-center gap-2 dark:text-darkTextPrimary">
                        <span className="w-3 h-3 rounded-full bg-gray-400 "></span>
                        93% Non-core work
                    </p>
                </div>
            </div>
            <div className="relative h-8 bg-[#f6f7f9] dark:bg-darkPrimaryBg rounded-xl border border-borderColor dark:border-darkBorder">
                {activePeriods.map((period, index) => {
                    const startPercent = (period.start / 24) * 100;
                    const endPercent = (period.end / 24) * 100;
                    const width = endPercent - startPercent;

                    return (
                        <div
                            key={index}
                            className="absolute h-8 bg-primary rounded-l-xl"
                            style={{
                                left: `${startPercent}%`,
                                width: `${width}%`,
                            }}
                        ></div>
                    );
                })}
            </div>
            <div className="flex justify-between mt-[2px]">
                {["1%", "25%", "50%", "75%", "100%"].map((label, i) => (
                    <span
                        key={i}
                        className="text-sm text-gray-400 dark:text-darkTextSecondary"
                    >
                        {label}
                    </span>
                ))}
            </div>

        </div>
    );
};

export default CoreWork;