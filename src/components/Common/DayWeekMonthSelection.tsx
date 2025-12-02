/* eslint-disable @typescript-eslint/no-explicit-any */

const DayWeekMonthSelection = ({ activeTab, handleTabClick }: any) => {
    return (
        <div className="grid grid-cols-3 lg:flex mt-3 w-[250px] lg:w-auto sm:mt-0 bg-bgSecondary dark:bg-darkSecondaryBg rounded-lg box-border ">
            {["Daily", "Weekly", "Monthly"].map((tab) => (
                <button
                    key={tab}
                    onClick={() => handleTabClick(tab as "Daily" | "Weekly" | "Monthly")}
                    className={`px-3.5 h-10 text-sm font-medium transition-all cursor-pointer rounded-lg min-w-[70px] text-center
                    ${activeTab === tab
                            ? "bg-bgPrimary dark:bg-darkPrimaryBg dark:text-darkTextPrimary text-headingTextColor outline-1 outline-borderColor dark:outline-darkBorder"
                            : " text-headingTextColor dark:text-darkTextPrimary hover:text-gray-800"
                        }`}
                >
                    {tab}
                </button>
            ))}
        </div>
    );
};

export default DayWeekMonthSelection;
