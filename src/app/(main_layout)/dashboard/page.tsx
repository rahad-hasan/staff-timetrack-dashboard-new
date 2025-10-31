"use client";

import HeadingComponent from "@/components/Common/HeadingComponent";
import { useState } from "react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"Daily" | "Weekly" | "Monthly">("Daily");
  console.log("Dashboard Rendered", activeTab);

  const handleTabClick = (tab: "Daily" | "Weekly" | "Monthly") => {
    setActiveTab(tab);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
      <HeadingComponent heading="Dashboard" subHeading="Mon, Aug 18, 2025 - Sun, Aug 24, 2025"></HeadingComponent>

      <div className="flex mt-3 sm:mt-0 bg-[#f6f7f9] dark:bg-darkSecondaryBg rounded-lg w-[240px] sm:w-auto">
        {["Daily", "Weekly", "Monthly"].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab as "Daily" | "Weekly" | "Monthly")}
            className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg m-0.5 ${activeTab === tab
              ? "bg-white dark:bg-darkPrimaryBg dark:text-darkTextPrimary text-headingTextColor shadow-sm"
              : "text-gray-600 dark:text-darkTextPrimary hover:text-gray-800"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
