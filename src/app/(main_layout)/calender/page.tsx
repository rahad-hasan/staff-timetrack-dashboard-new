"use client"
import MonthPicker from "@/components/Common/MonthPicker";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import CalenderTable from "@/components/Calender/CalenderTable";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import AddEventModal from "@/components/Calender/AddEventModal";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";

const CalenderPage = () => {
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
                <div>
                    <h1 className=" text-2xl md:text-3xl font-semibold text-headingTextColor dark:text-darkTextPrimary">Calender</h1>
                    <p className="text-sm text-subTextColor mt-2 dark:text-darkTextPrimary">
                        All the teams task and events are displayed here
                    </p>
                </div>
                <Dialog>
                    <form>
                        <DialogTrigger asChild>
                            <Button className=" "><Plus className="size-5" /> <span className=" hidden sm:block">Add an event</span></Button>
                        </DialogTrigger>
                        <AddEventModal></AddEventModal>
                    </form>
                </Dialog>

            </div>

            <div className=" flex flex-col gap-4 sm:gap-0 sm:flex-row justify-between w-full">
                <MonthPicker selectedDate={selectedDate} setSelectedDate={setSelectedDate}></MonthPicker>
                <SelectUserDropDown users={users}></SelectUserDropDown>
            </div>
            <CalenderTable></CalenderTable>
        </div>
    );
};

export default CalenderPage;