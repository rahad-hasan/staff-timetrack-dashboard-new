/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Bell, Settings } from "lucide-react";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import { Suspense, useEffect, useState } from "react";
import UnusualActivityTable from "@/components/Insights/UnusualActivity/UnusualActivityTable";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";
import { getMembersDashboard } from "@/actions/members/action";

const UnusualActivity = () => {
  const [users, setUsers] = useState<any>([]);

  useEffect(() => {
    const getMembers = async () => {
      const res = await getMembersDashboard();

      const users = res.data.map((u) => ({
        id: String(u.id),
        label: u.name,
        avatar: u.image || "",
      }));

      setUsers(users);
    };

    getMembers();
  }, []);
  const [activeTab, setActiveTab] = useState<
    "Highly Unusual" | "Unusual" | "Slightly Unusual"
  >("Highly Unusual");

  const handleTabClick = (
    tab: "Highly Unusual" | "Unusual" | "Slightly Unusual",
  ) => {
    setActiveTab(tab);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <HeadingComponent
          heading="Unusual Activity"
          subHeading="All the Unusual activity during the working hour by team member is here"
        ></HeadingComponent>

        <div className=" flex items-center gap-1.5 sm:gap-3">
          <button
            className={`px-3 sm:px-4 py-2 sm:py-[7px] flex items-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 text-gray-600 hover:text-textGray dark:bg-darkPrimaryBg dark:text-darkTextSecondary border border-borderColor"
                                `}
          >
            <Bell size={20} />{" "}
            <span className=" hidden sm:block">Smart Notification </span>
          </button>
          <button
            className={`px-2.5 py-2 flex items-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 text-gray-600 dark:border-darkBorder hover:text-textGray border border-borderColor dark:bg-darkPrimaryBg"
                                `}
          >
            <Settings className=" text-primary" size={20} />
          </button>
        </div>
      </div>
      <Suspense fallback={null}>
        <div className=" mb-5 flex flex-col gap-4 sm:gap-0 sm:flex-row justify-between">
          <div className=" flex flex-col md:flex-row gap-4 md:gap-3">
            <SpecificDatePicker></SpecificDatePicker>
          </div>
          <div className=" flex items-center gap-3">
            <SelectUserDropDown users={users}></SelectUserDropDown>
          </div>
        </div>
      </Suspense>

      <div className="inline-flex mt-3 sm:mt-0 h-10 bg-bgSecondary dark:bg-darkSecondaryBg rounded-lg">
        {["Highly Unusual", "Unusual", "Slightly Unusual"].map((tab) => (
          <button
            key={tab}
            onClick={() =>
              handleTabClick(
                tab as "Highly Unusual" | "Unusual" | "Slightly Unusual",
              )
            }
            className={`px-3 py-2 text-[13px] sm:text-sm font-medium transition-all cursor-pointer rounded-lg ${
              activeTab === tab
                ? "bg-bgPrimary dark:bg-darkPrimaryBg dark:text-darkTextPrimary text-headingTextColor outline-1 outline-borderColor dark:outline-darkBorder shadow"
                : "text-subTextColor dark:text-darkTextPrimary hover:text-gray-800"
            } flex-shrink-0`} // Ensure buttons shrink to fit content
          >
            {tab}
          </button>
        ))}
      </div>

      <UnusualActivityTable></UnusualActivityTable>
    </div>
  );
};

export default UnusualActivity;
