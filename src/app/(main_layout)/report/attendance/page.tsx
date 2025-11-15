"use client"
import { useState } from "react";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import { Checkbox } from "@/components/ui/checkbox";
import AttendanceTable from "@/components/Report/Attendance/AttendanceTable";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";
// import AttendanceTableSkeleton from "@/skeleton/report/Attendance/AttendanceTableSkeleton";

const AttendancePage = () => {
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <HeadingComponent heading="Attendance" subHeading="All the Attendance during the working hour by team member is here"></HeadingComponent>

            </div>
            <div className=" flex items-center justify-between w-full">
                <div className="flex flex-col md:flex-row gap-4 md:gap-3 w-full">
                    <SpecificDatePicker selectedDate={selectedDate} setSelectedDate={setSelectedDate}></SpecificDatePicker>
                    <div className=" flex items-center justify-between">
                        <div className="w-1/2">
                            <SelectUserDropDown users={users}></SelectUserDropDown>
                        </div>
                        <div className=" flex md:hidden items-center gap-2">
                            <Checkbox className=" cursor-pointer border-primary" />
                            <p>No check in data</p>
                        </div>
                    </div>
                </div>

                <div className=" w-[180px] hidden md:flex items-center justify-end gap-2">
                    <Checkbox className=" cursor-pointer border-primary" />
                    <p className=" text-base">No check in data</p>
                </div>
            </div>
            <AttendanceTable></AttendanceTable>
            {/* <AttendanceTableSkeleton></AttendanceTableSkeleton> */}
        </div>
    );
};

export default AttendancePage;