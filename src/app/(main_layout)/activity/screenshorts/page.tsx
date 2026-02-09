import { Button } from "@/components/ui/button";
import { NotepadText } from "lucide-react";
// import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import AllNotesModal from "@/components/Activity/ScreenShorts/AllNotes";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import HeadingComponent from "@/components/Common/HeadingComponent";
import { ISearchParamsProps } from "@/types/type";
import ScreenshotsToggle from "@/components/Activity/ScreenShorts/ScreenshotsToggle";
import ScreenShotsServer from "@/components/Activity/ScreenShorts/ScreenShotsServer";
import { Metadata } from "next";

import SelectProjectWrapper from "@/components/Common/SelectProjectWrapper";
import { getTimezones } from "@/actions/dashboard/action";
import SelectTimezoneDropDown from "@/components/Common/SelectTimezoneDropDown";
import SelectUserWrapper from "@/components/Common/SelectUserWrapper";


export const metadata: Metadata = {
  title: "Staff Time Tracker Screenshot",
  description: "Staff Time Tracker Screenshot",
};
const ScreenShorts = async ({ searchParams }: ISearchParamsProps) => {

  const timezones = await getTimezones();

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-5">
        <HeadingComponent
          heading="Screenshot"
          subHeading="All the screenshot during the working hour by team member is here"
        ></HeadingComponent>
        <Suspense fallback={null}>
          <ScreenshotsToggle></ScreenshotsToggle>
        </Suspense>
      </div>
      <div className="mb-5 flex flex-col gap-4 lg:gap-4 xl:flex-row justify-between">
        <Suspense fallback={null}>
          <div className=" flex flex-col lg:flex-row gap-3">
            <SpecificDatePicker></SpecificDatePicker>
            <SelectTimezoneDropDown timezones={timezones} />
            <SelectProjectWrapper></SelectProjectWrapper>
          </div>
        </Suspense>
        <div className=" flex items-center gap-3">
          <Dialog>
            <form>
              <DialogTrigger asChild>
                <Button
                  className="dark:text-darkTextPrimary h-10"
                  variant={"outline2"}
                >
                  <NotepadText className="text-sm md:text-base dark:text-darkTextPrimary" />
                  Notes
                </Button>
              </DialogTrigger>
              <AllNotesModal searchParams={searchParams}></AllNotesModal>
            </form>
          </Dialog>
          <Suspense fallback={null}>
            <div className="w-full">
              <SelectUserWrapper />
            </div>
          </Suspense>
        </div>
      </div>

      <ScreenShotsServer searchParams={searchParams}></ScreenShotsServer>
    </div>
  );
};

export default ScreenShorts;
