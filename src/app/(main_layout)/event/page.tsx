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
                <div className="mb-5 flex flex-col gap-4 rounded-lg border border-borderColor bg-white px-4 py-4 shadow-sm dark:border-darkBorder dark:bg-darkSecondaryBg sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                        <p className="text-sm font-semibold text-headingTextColor dark:text-darkTextPrimary">
                            Navigate the month
                        </p>
                        <p className="mt-1 text-xs leading-5 text-subTextColor dark:text-darkTextSecondary">
                            Move through past and upcoming schedules, then open any event directly
                            from the calendar drawer workflow.
                        </p>
                    </div>
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
