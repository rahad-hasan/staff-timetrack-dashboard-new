"use client"

import { Settings } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { useState } from "react";
import AppNameTable from "@/components/Activity/App/AppNameTable";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";
// import AppNameTableSkeleton from "@/skeleton/activity/app/AppNameTableSkeleton";


const App = () => {
    console.log('app');
    // Filter
    const projects = [
        {
            value: "Time Tracker",
            label: "Time Tracker",
            avatar: "https://picsum.photos/200/300",
        },
        {
            value: "E-commerce",
            label: "E-commerce",
            avatar: "https://picsum.photos/200/300",
        },
        {
            value: "Fack News Detection",
            label: "Fack News Detection",
            avatar: "https://picsum.photos/200/300",
        },
        {
            value: "Travel Together",
            label: "Travel Together",
            avatar: "https://picsum.photos/200/300",
        },
        {
            value: "Time Tracker2",
            label: "Time Tracker2",
            avatar: "https://picsum.photos/200/300",
        },
    ]
    const users = [
        {
            value: "Juyed Ahmed",
            label: "Juyed Ahmed",
            avatar: "https://avatar.iran.liara.run/public/18",
        },
        {
            value: "Cameron Williamson",
            label: "Cameron Williamson",
            avatar: "https://avatar.iran.liara.run/public/19",
        },
        {
            value: "Jenny Wilson",
            label: "Jenny Wilson",
            avatar: "https://avatar.iran.liara.run/public/20",
        },
        {
            value: "Esther Howard",
            label: "Esther Howard",
            avatar: "https://avatar.iran.liara.run/public/21",
        },
        {
            value: "Walid Ahmed",
            label: "Walid Ahmed",
            avatar: "https://avatar.iran.liara.run/public/22",
        },
    ]

    // date picker
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-5">
                <HeadingComponent heading="App Activity" subHeading="All the app during the working hour by team member is here"></HeadingComponent>

                <div className=" flex items-center gap-1.5 sm:gap-3">
                    {/* <button
                        className={`px-3 sm:px-4 py-2 sm:py-2 flex items-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 text-gray-600 hover:text-textGray dark:bg-darkPrimaryBg dark:text-darkTextSecondary border border-borderColor"
                                `}
                    >
                        <Download size={20} /> <span className=" hidden sm:block">Export</span>
                    </button> */}
                    <button
                        className={`px-3 py-2 flex items-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 text-gray-600 dark:border-darkBorder hover:text-textGray border border-borderColor "
                                `}
                    >
                        <Settings className=" text-primary" size={20} />
                    </button>
                </div>
            </div>


            <div className=" mb-5 flex flex-col gap-4 sm:gap-3 xl:flex-row justify-between">
                <div className=" flex flex-col sm:flex-row gap-4 md:gap-3">
                    <SpecificDatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate}></SpecificDatePicker>
                    {/* Filter */}
                    {/* <Button className=" hidden md:flex dark:text-darkTextPrimary" variant={'filter'}>
                        <SlidersHorizontal className="dark:text-darkTextPrimary" /> Filters
                    </Button> */}
                    <SelectProjectDropDown projects={projects}></SelectProjectDropDown>
                </div>

                <div className=" flex items-center gap-3">
                    <SelectUserDropDown users={users}></SelectUserDropDown>
                </div>
            </div>
            <AppNameTable></AppNameTable>
            {/* <AppNameTableSkeleton></AppNameTableSkeleton> */}
        </div>
    );
};

export default App;