"use client";

import DayWeekMonthSelection from "@/components/Common/DayWeekMonthSelection";
import HeadingComponent from "@/components/Common/HeadingComponent";
import HeroSection from "@/components/Dashboard/HeroSection";
import DashboardHeroSkeleton from "@/skeleton/DashboardHeroSkeleton";
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
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
        <HeadingComponent heading="Dashboard" subHeading={date}></HeadingComponent>
        <DayWeekMonthSelection activeTab={activeTab} handleTabClick={handleTabClick}></DayWeekMonthSelection>
      </div>
      <HeroSection></HeroSection>
      {/* <DashboardHeroSkeleton></DashboardHeroSkeleton> */}
    </div>

  );
}
