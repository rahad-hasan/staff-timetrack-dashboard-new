import { Settings } from "lucide-react";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";
import UrlsTableServer from "@/components/Activity/Urls/UrlsTableServer";
import UrlsTableSkeleton from "@/skeleton/activity/url/UrlsTableSkeleton";
import { Suspense } from "react";
import { ISearchParamsProps } from "@/types/type";

const Urls = ({ searchParams }: ISearchParamsProps) => {

    return (
        <div>
            <div className="flex justify-between gap-3 mb-5">
                <HeadingComponent heading="URLs Activity" subHeading="All the URLs activity during the working hour by team member is here"></HeadingComponent>

                <div className=" flex items-center gap-1.5 sm:gap-3">
                    {/* <button
                        className={`px-3 sm:px-4 py-2 sm:py-2 flex items-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 text-gray-600 hover:text-textGray dark:bg-darkPrimaryBg dark:text-darkTextSecondary border border-borderColor"
                                `}
                    >
                        <Download size={20} /> <span className=" hidden sm:block">Export</span>
                    </button> */}
                    <button
                        className={`px-2.5 py-2 flex items-center gap-2 font-medium transition-all cursor-pointer rounded-lg m-0.5 text-gray-600 dark:border-darkBorder hover:text-textGray border border-borderColor "
                                `}
                    >
                        <Settings className=" text-primary" size={20} />
                    </button>
                </div>
            </div>

            {/* <div className=" mb-5 flex flex-col gap-4 sm:gap-3 xl:flex-row justify-between">
                <div className=" flex flex-col sm:flex-row gap-3">
                    <SpecificDatePicker></SpecificDatePicker>
                    {/* Filter */}
            {/* <Button className=" hidden lg:flex dark:text-darkTextPrimary" variant={'filter'}>
                        <SlidersHorizontal className="dark:text-darkTextPrimary" /> Filters
                    </Button> 
                    <SelectProjectDropDown></SelectProjectDropDown>
                </div>
                <div className=" flex items-center gap-3">
                    <SelectUserDropDown></SelectUserDropDown>
                </div>
            </div>
             */}

            <Suspense fallback={null}>
                <div className="mb-5 flex flex-col gap-4 sm:gap-3 xl:flex-row justify-between">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <SpecificDatePicker />
                        <SelectProjectDropDown />
                    </div>

                    <div className="flex items-center gap-3">
                        <SelectUserDropDown />
                    </div>
                </div>
            </Suspense>
            <Suspense fallback={<UrlsTableSkeleton />}>
                <UrlsTableServer searchParams={searchParams} />
            </Suspense>
            {/* <UrlsTableSkeleton></UrlsTableSkeleton> */}
        </div>
    );
};

export default Urls;