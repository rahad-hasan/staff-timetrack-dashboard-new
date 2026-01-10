"use client"
import MonthPicker from "@/components/Common/MonthPicker";
import { Suspense } from "react";
import CalenderTable from "@/components/Calender/CalenderTable";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import CalenderHeading from "@/components/Calender/CalenderHeading";

const CalenderPage = () => {

    return (
        <div>
            <CalenderHeading></CalenderHeading>
            <Suspense fallback={null}>
                <div className=" flex flex-col gap-4 sm:gap-0 sm:flex-row justify-between w-full">
                    <MonthPicker></MonthPicker>
                    <SelectUserDropDown></SelectUserDropDown>
                </div>
            </Suspense>
            <CalenderTable></CalenderTable>
        </div>
    );
};

export default CalenderPage;