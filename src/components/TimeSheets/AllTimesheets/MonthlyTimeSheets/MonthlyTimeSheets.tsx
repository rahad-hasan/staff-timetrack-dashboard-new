"use client"
import MonthlyTimeSheetsCalendar from "./MonthlyTimeSheetsCalendar";
import { useState } from "react";
import MonthPicker from "@/components/Common/MonthPicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";

const MonthlyTimeSheets = () => {
    const [value, setValue] = useState("")
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
    // month picker
    const [selectedDate, setSelectedDate] = useState(new Date());

    return (
        <div>
            <div className=" mb-5 flex flex-col gap-4 md:gap-0 sm:flex-row justify-between">
                <div className="flex gap-3">
                    <MonthPicker selectedDate={selectedDate} setSelectedDate={setSelectedDate}></MonthPicker>
                    <div className=" hidden md:block h-full">
                        <SelectProjectDropDown projects={projects} setValue={setValue} value={value}></SelectProjectDropDown>
                    </div>
                </div>
                <SelectUserDropDown users={users}></SelectUserDropDown>
            </div>
            <MonthlyTimeSheetsCalendar></MonthlyTimeSheetsCalendar>
        </div>
    );
};

export default MonthlyTimeSheets;