import MonthPicker from "@/components/Common/MonthPicker";
import { Suspense } from "react";
// import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import CalenderHeading from "@/components/Event/CalenderHeading";
import CalenderTableServer from "@/components/Event/CalenderTableServer";
import { ISearchParamsProps } from "@/types/type";
import CalenderSkeleton from "@/skeleton/event/CalenderSkeleton";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Staff Time Tracker Event",
    description: "Staff Time Tracker Event",
};
const CalenderPage = async ({ searchParams }: ISearchParamsProps) => {
    return (
        <div>
            <CalenderHeading></CalenderHeading>
            <Suspense fallback={null}>
                <div className=" flex flex-col gap-4 sm:gap-0 sm:flex-row justify-between w-full">
                    <MonthPicker></MonthPicker>
                    {/* <SelectUserDropDown></SelectUserDropDown> */}
                </div>
            </Suspense>
            <Suspense fallback={<CalenderSkeleton />}>
                {
                    <CalenderTableServer searchParams={searchParams} />
                }
            </Suspense>
        </div>
    );
};

export default CalenderPage;