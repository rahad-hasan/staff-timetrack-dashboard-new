"use client"
import MonthPicker from "@/components/Common/MonthPicker";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import CalenderTable from "@/components/Calender/CalenderTable";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import AddEventModal from "@/components/Calender/AddEventModal";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";

const CalenderPage = () => {

    return (
        <div>
            <div className="flex items-center justify-between gap-3 mb-5">
                <HeadingComponent heading="Calender" subHeading="All the teams task and events are displayed here"></HeadingComponent>

                <Dialog>
                    <form>
                        <DialogTrigger asChild>
                            <Button className=""><Plus className="size-5" /> <span className=" hidden sm:block">Add an event</span></Button>
                        </DialogTrigger>
                        <AddEventModal></AddEventModal>
                    </form>
                </Dialog>

            </div>
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