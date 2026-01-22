import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";
import ManualRequestTableServer from "@/components/TimeSheets/ManualRequests/ManualRequestTableServer";
import { ISearchParamsProps } from "@/types/type";
import ManualRequestsHeroSection from "@/components/TimeSheets/ManualRequests/ManualRequestsHeroSection";
import { Suspense } from "react";

const ManualRequests = async ({ searchParams }: ISearchParamsProps) => {

    return (
        <div>
            <div className="flex items-center justify-between gap-3 md:gap-0 mb-5">
                <HeadingComponent heading="Manual Requests" subHeading="All the timesheet by team member who completed is displayed here"></HeadingComponent>
                <ManualRequestsHeroSection></ManualRequestsHeroSection>
            </div>
            <Suspense fallback={null}>
                <div className=" flex flex-col sm:flex-row justify-between items-center gap-4 md:gap-3 mb-5">
                    {/* <div className="">
                    <Button className=" w-10 sm:w-auto h-10 sm:h-auto dark:text-darkTextPrimary" variant={'outline2'}>
                        <SlidersHorizontal className="" /> <span className=" hidden sm:block dark:text-darkTextPrimary">Filters</span>
                    </Button>
                </div> */}
                    <SelectProjectDropDown></SelectProjectDropDown>
                    <SelectUserDropDown></SelectUserDropDown>
                </div>
            </Suspense>

            <ManualRequestTableServer searchParams={searchParams} />
            {/* <ManualRequestsSkeleton></ManualRequestsSkeleton> */}
        </div>
    );
};

export default ManualRequests;