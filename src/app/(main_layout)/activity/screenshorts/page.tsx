import { Button } from "@/components/ui/button";
import { NotepadText } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import {
    Dialog,
    DialogTrigger,
} from "@/components/ui/dialog"
import AllNotesModal from "@/components/Activity/ScreenShorts/AllNotes";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import HeadingComponent from "@/components/Common/HeadingComponent";
import SelectProjectDropDown from "@/components/Common/SelectProjectDropDown";
import { ISearchParamsProps } from "@/types/type";
import ScreenshotsToggle from "@/components/Activity/ScreenShorts/ScreenshotsToggle";

import ScreenShotsServer from "@/components/Activity/ScreenShorts/ScreenShotsServer";

const ScreenShorts = ({ searchParams }: ISearchParamsProps) => {

    return (
        <div>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-5">
                <HeadingComponent heading="Screenshot" subHeading="All the screenshot during the working hour by team member is here"></HeadingComponent>
                <Suspense fallback={null}>
                    <ScreenshotsToggle></ScreenshotsToggle>
                </Suspense>

            </div>
            <div className="mb-5 flex flex-col gap-4 lg:gap-4 xl:flex-row justify-between">
                <Suspense fallback={null}>
                    <div className=" flex flex-col lg:flex-row gap-3">
                        <SpecificDatePicker></SpecificDatePicker>
                        {/* Filter */}
                        {/* 
                    <Button className=" hidden xl:flex dark:text-darkTextPrimary" variant={'filter'}>
                        <SlidersHorizontal className="dark:text-darkTextPrimary" /> Filters
                    </Button> */}
                        <SelectProjectDropDown></SelectProjectDropDown>
                    </div>
                </Suspense>
                <div className=" flex items-center gap-3">
                    <Dialog>
                        <form>
                            <DialogTrigger asChild>
                                <Button className="dark:text-darkTextPrimary h-10" variant={'outline2'}>
                                    <NotepadText className=" text-sm md:text-base dark:text-darkTextPrimary" /> All Notes
                                </Button>
                            </DialogTrigger>
                            <AllNotesModal searchParams={searchParams}></AllNotesModal>
                        </form>
                    </Dialog>
                    <Suspense fallback={null}>
                        <div className=" w-full">
                            <SelectUserDropDown></SelectUserDropDown>
                        </div>
                    </Suspense>
                </div>
            </div>

            <ScreenShotsServer searchParams={searchParams}></ScreenShotsServer>
        </div>
    );
};

export default ScreenShorts;