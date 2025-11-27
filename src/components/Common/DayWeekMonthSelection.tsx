/* eslint-disable @typescript-eslint/no-explicit-any */

const DayWeekMonthSelection = ({ activeTab, handleTabClick }:any) => {
    return (
        <div className="flex mt-3 sm:mt-0 bg-bgSecondary dark:bg-darkSecondaryBg rounded-lg sm:w-auto">
            {["Daily", "Weekly", "Monthly"].map((tab) => (
                <button
                    key={tab}
                    onClick={() => handleTabClick(tab as "Daily" | "Weekly" | "Monthly")}
                    className={`px-4 py-2.5 text-sm font-medium transition-all cursor-pointer rounded-lg ${activeTab === tab
                            ? " bg-bgPrimary dark:bg-darkPrimaryBg dark:text-darkTextPrimary text-headingTextColor border border-borderColor dark:border-darkBorder shadow"
                            : "text-subTextColor dark:text-darkTextPrimary hover:text-gray-800"
                        }`}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
};

export default DayWeekMonthSelection;