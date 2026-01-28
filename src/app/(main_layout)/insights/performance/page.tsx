import { Bell, Settings } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import { Suspense } from "react";
import CoreWork from "@/components/Insights/Performance/CoreWork";
import Utilization from "@/components/Insights/Performance/Utilization";
import DailyFocus from "@/components/Insights/Performance/DailyFocus";
import Activity from "@/components/Insights/Performance/Activity";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";
import { getMembersDashboard } from "@/actions/members/action";

const Performance = async () => {
  const res = await getMembersDashboard();

  const users = res.data.map((u) => ({
    id: String(u.id),
    label: u.name,
    avatar: u.image || "",
  }));

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <HeadingComponent
          heading="Performance"
          subHeading="All the Performance during the working hour by team member is here"
        ></HeadingComponent>

        <div className=" flex items-center gap-1.5 sm:gap-3">
          <button
            className={`px-3 sm:px-4 py-2 sm:py-[7px] flex items-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 bg-bgSecondary dark:bg-darkPrimaryBg text-gray-600 hover:text-textGray dark:text-darkTextSecondary border border-borderColor"
                                `}
          >
            <Bell size={20} />{" "}
            <span className=" hidden sm:block text-headingTextColor dark:text-darkTextPrimary ">
              Smart Notification{" "}
            </span>
          </button>
          <button
            className={`px-2.5 py-2 flex items-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 text-gray-600 dark:border-darkBorder hover:text-textGray dark:bg-darkPrimaryBg border border-borderColor "
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
      <div className="flex items-center gap-3">
        <Switch id="benchmarks" />
        <label
          htmlFor="benchmarks"
          className="flex items-center gap-2 text-sm font-medium text-gray-700  cursor-pointer"
        >
          <span className=" text-headingTextColor dark:text-darkTextPrimary">
            Benchmarks
          </span>
          <span className="flex items-center gap-1 dark:text-darkTextPrimary">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 "></span>
            Other Industry average
          </span>
        </label>
      </div>
      {/* performance */}
      <div className="flex flex-col lg:flex-row gap-5 my-5">
        <Utilization></Utilization>
        <CoreWork></CoreWork>
      </div>
      <div className="flex flex-col lg:flex-row gap-5 my-5">
        <DailyFocus></DailyFocus>
        <Activity></Activity>
      </div>
    </div>
  );
};

export default Performance;
