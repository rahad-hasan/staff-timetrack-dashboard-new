import WeeklyTimeSheetsTable from "./WeeklyTimeSheetsTable";
import { Button } from "../../../ui/button";
import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import WeeklyDatePicker from "@/components/Common/WeeklyDatePicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";

const WeeklyTimeSheets = () => {
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
    const [centerDate, setCenterDate] = useState(new Date());
    console.log(centerDate);


    return (
        <div>
            <div className=" mb-5 flex flex-col gap-4 lg:gap-0 lg:flex-row justify-between">
                <div className=" flex gap-3">
                    <WeeklyDatePicker centerDate={centerDate} setCenterDate={setCenterDate} />
                    <div className=" hidden md:block">
                        <Button className="dark:text-darkTextPrimary" variant={'filter'}>
                            <SlidersHorizontal className=" dark:text-darkTextPrimary" /> Filters
                        </Button>
                    </div>
                </div>
                <SelectUserDropDown users={users}></SelectUserDropDown>
            </div>

            <WeeklyTimeSheetsTable></WeeklyTimeSheetsTable>
        </div>
    );
};

export default WeeklyTimeSheets;