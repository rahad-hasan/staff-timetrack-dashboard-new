import { Circle } from "lucide-react";
import screenshort1 from "../../../assets/dashboard/screenshort1.png";
import screenshort2 from "../../../assets/dashboard/screenshort2.png";
import screenshort3 from "../../../assets/dashboard/screenshort3.png";
import Image, { StaticImageData } from "next/image";

const AllScreenShorts = () => {
    console.log('AllScreenShorts');
    interface IScreenShortsTimely {
        _id: number;
        start: string;
        end: string;
        duration: string;
        progress: number;
        activity: number;
        screenshotCount: number;
        screenShort: string | StaticImageData;
        project: string;
        task: string;
    }
    const screenShortsTimely: IScreenShortsTimely[] = [
        {
            _id: 1,
            start: "9:00 AM",
            end: "9:10 AM",
            duration: "10 minutes",
            progress: 20,
            activity: 45,
            screenshotCount: 3,
            screenShort: screenshort1,
            project: "Orbit Technology's Project",
            task: "No Task",
        },
        {
            _id: 2,
            start: "9:10 AM",
            end: "9:20 AM",
            duration: "10 minutes",
            progress: 49,
            activity: 70,
            screenshotCount: 3,
            screenShort: screenshort2,
            project: "Orbit Technology's Project",
            task: "No Task",
        },
        {
            _id: 3,
            start: "9:20 AM",
            end: "9:30 AM",
            duration: "10 minutes",
            progress: 80,
            activity: 25,
            screenshotCount: 0,
            screenShort: screenshort1,
            project: "No Activity Listed",
            task: "No Task",
        },
        {
            _id: 4,
            start: "9:30 AM",
            end: "9:40 AM",
            duration: "10 minutes",
            progress: 25,
            activity: 65,
            screenshotCount: 3,
            screenShort: screenshort3,
            project: "Orbit Technology's Project",
            task: "No Task",
        },
        {
            _id: 5,
            start: "9:00 AM",
            end: "9:10 AM",
            duration: "10 minute1s",
            progress: 20,
            activity: 45,
            screenshotCount: 3,
            screenShort: screenshort1,
            project: "Orbit Technology's Project",
            task: "No Task",
        }
    ];

    return (
        <>
            {/* map and under map */}
            <div className="">
                <div className=" flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-between sm:items-center">
                    <div className=" flex items-center gap-2">
                        <Circle size={20} className=" text-gray-200 dark:text-darkTextPrimary" />
                        <p className=" text-subTextColor dark:text-darkTextSecondary"> 9:10 am - 10:00 am</p>
                    </div>

                    <h2 className=" text-lg  text-subTextColor dark:text-darkTextSecondary">
                        Total time worked: <span className=" font-semibold">1:00:00</span>
                    </h2>
                </div>

                <div className=" mt-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">

                    {

                        screenShortsTimely.map((screenShort) => (
                            <div key={screenShort?._id} className=" p-3 flex-nowrap rounded-lg border border-borderColor dark:border-darkBorder">

                                <Image
                                    src={screenShort.screenShort}
                                    width={300}
                                    height={300}
                                    className="rounded-lg w-full transition-transform duration-300 hover:scale-[1.01]"
                                    alt="screenshot"
                                />


                                <div className="mt-3">
                                    <div className="flex justify-between items-center">
                                        <p className="md:text-lg text-textGray dark:text-darkTextSecondary">
                                            {screenShort.start}
                                        </p>
                                    </div>
                                    <h2 className="mt-1 text-sm sm:text-lg font-semibold dark:text-darkTextPrimary">
                                        {screenShort.project}
                                    </h2>
                                    <p className="text-sm sm:text-base text-textGray dark:text-darkTextSecondary">{screenShort.task}</p>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
            {/* map and under map */}
            <div className="">
                <div className=" flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-between sm:items-center">
                    <div className=" flex items-center gap-2">
                        <Circle size={20} className=" text-gray-200 dark:text-darkTextPrimary" />
                        <p className=" text-subTextColor dark:text-darkTextSecondary"> 9:10 am - 10:00 am</p>
                    </div>

                    <h2 className=" text-lg  text-subTextColor dark:text-darkTextSecondary">
                        Total time worked: <span className=" font-semibold">1:00:00</span>
                    </h2>
                </div>

                <div className=" mt-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">

                    {

                        screenShortsTimely.map((screenShort) => (
                            <div key={screenShort?._id} className=" p-3 flex-nowrap rounded-lg border border-borderColor dark:border-darkBorder">

                                <Image
                                    src={screenShort.screenShort}
                                    width={300}
                                    height={300}
                                    className="rounded-lg w-full transition-transform duration-300 hover:scale-[1.01]"
                                    alt="screenshot"
                                />


                                <div className="mt-3">
                                    <div className="flex justify-between items-center">
                                        <p className="md:text-lg text-textGray dark:text-darkTextSecondary">
                                            {screenShort.start}
                                        </p>
                                    </div>
                                    <h2 className="mt-1 text-sm sm:text-lg font-semibold dark:text-darkTextPrimary">
                                        {screenShort.project}
                                    </h2>
                                    <p className="text-sm sm:text-base text-textGray dark:text-darkTextSecondary">{screenShort.task}</p>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </>
    );
};

export default AllScreenShorts;