"use client"
import { useRouter, useSearchParams } from "next/navigation";

const ScreenshotsToggle = () => {
    type Tab = "Every 10 min" | "All Screenshots";
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = (searchParams.get("tab") as Tab) ?? "Every 10 min";
    const setTab = (tab: Tab) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("tab", tab);
        router.push(`?${params.toString()}`);
    };
    
    return (
        <div className="flex gap-3">
            <div className="grid grid-cols-2 xl:flex mt-3 lg:mt-0 bg-bgSecondary dark:bg-darkSecondaryBg rounded-lg ">
                {["Every 10 min", "All Screenshots"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setTab(tab as "Every 10 min" | "All Screenshots")}
                        className={`px-3.5 h-10 text-sm font-medium transition-all cursor-pointer rounded-lg text-center
                                    ${activeTab === tab
                                ? "bg-bgPrimary dark:bg-darkPrimaryBg dark:text-darkTextPrimary text-headingTextColor outline-1 outline-borderColor dark:outline-darkBorder shadow"
                                : " text-headingTextColor dark:text-darkTextPrimary hover:text-gray-800"
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>
            {/* <Button><Plus size={20} />Add Time</Button> */}
        </div>
    );
};

export default ScreenshotsToggle;