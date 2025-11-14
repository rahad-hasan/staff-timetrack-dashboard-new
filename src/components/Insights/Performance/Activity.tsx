import { Info } from "lucide-react";

const Activity = () => {

    const secondBarValue = 20;
    const secondBarRange = { start: 50, end: 65 };

    const segments = [
        { id: 'red', percentage: 20, color: 'bg-red-400', rounded: 'rounded-b-lg' },
        { id: 'orange', percentage: 40, color: 'bg-orange-300' },
        { id: 'green', percentage: 40, color: 'bg-green-400', rounded: 'rounded-t-lg' },
    ];
    // const labels = ['100%', '80%', '60%', '40%', '20%'];
    const labels = ['20%', '40%', '60%', '80%', '100%'];
    return (
        <div className=" border-2 border-borderColor dark:border-darkBorder py-3 px-5 rounded-[12px] w-full">
            <div className=" flex gap-3 items-center mb-8">
                <h2 className="text-base sm:text-lg text-headingTextColor dark:text-darkTextPrimary">Activity</h2>
                <Info size={18} className=" cursor-pointer" />
            </div>
            <div className=" flex  justify-between mb-5 pb-7 border-b dark:border-darkBorder">
                <div className="">
                    <p className="text-3xl text-headingTextColor mr-2 dark:text-darkTextPrimary">58%</p>
                    <p className="text-lg text-subTextColor dark:text-darkTextSecondary">Activity</p>
                </div>
                <div className="">
                    <div className="flex items-end space-x-4 px-6  rounded-xl ">
                        <div className="flex flex-col justify-between h-44 text-gray-700 text-sm font-medium">
                            {labels.reverse().map((label, index) => (
                                <div key={index} className="h-full flex items-center text-subTextColor dark:text-darkTextSecondary">{label}</div>
                            ))}
                        </div>
                        <div className="relative w-12 h-44 bg-gray-200 rounded-lg overflow-hidden flex flex-col-reverse">
                            {segments.map((segment, index) => {
                                let roundedClass = '';
                                if (index === 0) {
                                    roundedClass = 'rounded-b-lg';
                                }
                                else if (index === segments.length - 1) {
                                    roundedClass = 'rounded-t-lg';
                                }
                                return (
                                    <div
                                        key={segment.id}
                                        className={`w-full ${segment.color} ${roundedClass}`}
                                        style={{ height: `${segment.percentage}%` }}
                                    ></div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className=" flex items-center gap-2 mt-0">
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

export default Activity;