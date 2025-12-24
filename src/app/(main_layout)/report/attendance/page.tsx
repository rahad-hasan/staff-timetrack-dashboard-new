import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";
import { ISearchParamsProps } from "@/types/type";
import AttendanceServer from "@/components/Report/Attendance/AttendanceServer";
import { Suspense } from "react";
import AttendanceTableSkeleton from "@/skeleton/report/Attendance/AttendanceTableSkeleton";

const AttendancePage = async ({ searchParams }: ISearchParamsProps) => {
    const params = searchParams;

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <HeadingComponent heading="Attendance" subHeading="All the Attendance during the working hour by team member is here"></HeadingComponent>

            </div>
            <div className=" flex items-center justify-between w-full">
                <div className="flex flex-col md:flex-row gap-4 md:gap-3 w-full">
                    <SpecificDatePicker></SpecificDatePicker>
                    <div className=" flex items-center justify-between">
                        <div className="w-1/2">
                            <SelectUserDropDown defaultSelect={false} ></SelectUserDropDown>
                        </div>
                        {/* <div className=" flex md:hidden items-center gap-2">
                            <Checkbox className=" cursor-pointer border-primary" />
                            <p>No check in data</p>
                        </div> */}
                    </div>
                </div>

                {/* <div className=" w-[180px] hidden md:flex items-center justify-end gap-2">
                    <Checkbox className=" cursor-pointer border-primary" />
                    <p className=" text-base">No check in data</p>
                </div> */}
            </div>
            <Suspense fallback={<AttendanceTableSkeleton />}>
                <AttendanceServer searchParams={params}></AttendanceServer>
            </Suspense>

        </div>
    );
};

export default AttendancePage;