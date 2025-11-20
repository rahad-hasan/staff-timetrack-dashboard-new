"use client"
import WeeklyTimeSheetsTable from "./WeeklyTimeSheetsTable";
import { useState } from "react";
import WeeklyDatePicker from "@/components/Common/WeeklyDatePicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";

const WeeklyTimeSheets = () => {
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
    // date picker
    const [centerDate, setCenterDate] = useState(new Date());
    console.log(centerDate);

    return (
        <div>
            <div className=" mb-5 flex flex-col gap-4 xl:gap-0 xl:flex-row justify-between">
                <div className=" flex gap-3">
                    <WeeklyDatePicker centerDate={centerDate} setCenterDate={setCenterDate} />
                    <div className=" hidden md:block">
                        {/* <Button className="dark:text-darkTextPrimary" variant={'filter'}>
                            <SlidersHorizontal className=" dark:text-darkTextPrimary" /> Filters
                        </Button> */}
                        <SelectProjectDropDown projects={projects} setValue={setValue} value={value}></SelectProjectDropDown>
                    </div>
                </div>
                <SelectUserDropDown users={users}></SelectUserDropDown>
            </div>

            <WeeklyTimeSheetsTable></WeeklyTimeSheetsTable>
        </div>
    );
};

export default WeeklyTimeSheets;