"use client";

import HeadingComponent from "@/components/Common/HeadingComponent";
import { useState } from "react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"Daily" | "Weekly" | "Monthly">("Daily");
  console.log("Dashboard Rendered", activeTab);

  const handleTabClick = (tab: "Daily" | "Weekly" | "Monthly") => {
    setActiveTab(tab);
  };

  const getDailyDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const getWeeklyDate = () => {
    const startOfWeek = new Date();
    const endOfWeek = new Date();

    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startDate = startOfWeek.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

    const endDate = endOfWeek.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
    });

    return `${startDate} - ${endDate}`;
  };

  const getMonthlyDate = () => {
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const date =
    activeTab === "Daily"
      ? getDailyDate()
      : activeTab === "Weekly"
      ? getWeeklyDate()
      : activeTab === "Monthly"
      ? getMonthlyDate()
      : "";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
      <HeadingComponent heading="Dashboard" subHeading={date}></HeadingComponent>

      <div className="flex mt-3 sm:mt-0 bg-bgSecondary dark:bg-darkSecondaryBg rounded-lg w-[240px] sm:w-auto">
        {["Daily", "Weekly", "Monthly"].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab as "Daily" | "Weekly" | "Monthly")}
            className={`px-4 py-2 text-sm font-medium transition-all cursor-pointer rounded-lg m-0.5 ${
              activeTab === tab
                ? "bg-bgPrimary dark:bg-darkPrimaryBg dark:text-darkTextPrimary text-headingTextColor shadow-sm"
                : "text-subTextColor dark:text-darkTextPrimary hover:text-gray-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
