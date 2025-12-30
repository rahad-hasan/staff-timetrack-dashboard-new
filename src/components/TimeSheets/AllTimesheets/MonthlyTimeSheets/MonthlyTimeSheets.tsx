"use client"
import MonthlyTimeSheetsCalendar from "./MonthlyTimeSheetsCalendar";
import { useState } from "react";
import MonthPicker from "@/components/Common/MonthPicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";

const MonthlyTimeSheets = () => {
    // month picker
    const [selectedDate, setSelectedDate] = useState(new Date());

    return (
        <div>
            <div className=" mb-5 flex flex-col gap-4 md:gap-0 sm:flex-row justify-between">
                <div className="flex gap-3">
                    <MonthPicker selectedDate={selectedDate} setSelectedDate={setSelectedDate}></MonthPicker>
                    <div className=" hidden md:block h-full">
                        <SelectProjectDropDown ></SelectProjectDropDown>
                    </div>
                </div>
                <SelectUserDropDown ></SelectUserDropDown>
            </div>
            <MonthlyTimeSheetsCalendar></MonthlyTimeSheetsCalendar>
        </div>
    );
};

export default MonthlyTimeSheets;