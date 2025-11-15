import MonthlyTimeSheetsCalendar from "./MonthlyTimeSheetsCalendar";
import { Button } from "../../../ui/button";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import MonthPicker from "@/components/Common/MonthPicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";

const MonthlyTimeSheets = () => {
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

    // month picker
    const [selectedDate, setSelectedDate] = useState(new Date());

    return (
        <div>
            <div className=" mb-5 flex flex-col gap-4 md:gap-0 sm:flex-row justify-between">
                <div className="flex gap-3">
                    <MonthPicker selectedDate={selectedDate} setSelectedDate={setSelectedDate}></MonthPicker>
                    <div className=" hidden md:block">
                        <Button className="dark:text-darkTextPrimary bg-bgPrimary dark:bg-darkPrimaryBg" variant={'filter'}>
                            <SlidersHorizontal className="dark:text-darkTextPrimary" /> Filters
                        </Button>
                    </div>
                </div>
                <SelectUserDropDown users={users}></SelectUserDropDown>
            </div>
            <MonthlyTimeSheetsCalendar></MonthlyTimeSheetsCalendar>
        </div>
    );
};

export default MonthlyTimeSheets;