"use client"
import { Circle } from "lucide-react";
import screenshort1 from "../../../assets/dashboard/screenshort1.png";
import screenshort2 from "../../../assets/dashboard/screenshort2.png";
import screenshort3 from "../../../assets/dashboard/screenshort3.png";
import Image, { StaticImageData } from "next/image";
import { useState } from "react";
import { AnimatePresence } from 'framer-motion';
import ScreenShortsModal from "./ScreenShortsModal";

const AllScreenShorts = () => {
    console.log('AllScreenShorts');

    const [selectedImage, setSelectedImage] = useState<string | StaticImageData>();
    const [modalOpen, setModalOpen] = useState<boolean>(false);

    interface IScreenShort {
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

    interface IScreenShortsGroup {
        time: string;
        totalTimeWorked: string;
        allScreenshorts: IScreenShort[];
    }

    const screenShortsTimely: IScreenShortsGroup[] = [
        {
            time: "9:10 am - 10:00 am",
            totalTimeWorked: "1:00:00",
            allScreenshorts: [
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
                    _id: 4,
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
                    _id: 5,
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
                    _id: 6,
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
            ],
        },
        {
            time: "10:00 am - 11:00 am",
            totalTimeWorked: "0:50:00",
            allScreenshorts: [
                {
                    _id: 1,
                    start: "10:00 AM",
                    end: "10:10 AM",
                    duration: "10 minutes",
                    progress: 80,
                    activity: 25,
                    screenshotCount: 0,
                    screenShort: screenshort1,
                    project: "No Activity Listed",
                    task: "No Task",
                },
                {
                    _id: 2,
                    start: "10:10 AM",
                    end: "10:20 AM",
                    duration: "10 minutes",
                    progress: 25,
                    activity: 65,
                    screenshotCount: 3,
                    screenShort: screenshort3,
                    project: "Orbit Technology's Project",
                    task: "No Task",
                },
                {
                    _id: 3,
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
                    _id: 4,
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
                    _id: 5,
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
                    _id: 6,
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
            ],
        },
    ];

    const dummyScreenShorts = [
        {
            screenShort: selectedImage
        },
        {
            screenShort: screenshort1
        },
        {
            screenShort: screenshort2
        },
        {
            screenShort: screenshort3
        },
        {
            screenShort: screenshort2
        },
        {
            screenShort: screenshort3
        },
    ]

    return (
        <>
            {screenShortsTimely.map((group, groupIndex) => (
                <div key={groupIndex} className={groupIndex > 0 ? "mt-5" : ""}>
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-between sm:items-center">
                        <div className="flex items-center gap-2">
                            <Circle size={20} className="text-gray-200 dark:text-darkTextPrimary" />
                            <p className="text-subTextColor dark:text-darkTextSecondary">{group.time}</p>
                        </div>

                        <h2 className="text-lg text-subTextColor dark:text-darkTextSecondary">
                            Total time worked: <span className="font-medium">{group.totalTimeWorked}</span>
                        </h2>
                    </div>

                    {/* Screenshot Grid */}
                    <div className="mt-3 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                        {group.allScreenshorts.map((screenShort) => (
                            <div
                                key={screenShort._id}
                                className="p-2 flex-nowrap rounded-lg border border-borderColor dark:border-darkBorder"
                            >
                                <Image
                                    src={screenShort.screenShort}
                                    onClick={() => {
                                        setSelectedImage(screenShort.screenShort);
                                        setModalOpen(true);
                                    }}
                                    width={300}
                                    height={300}
                                    className="rounded-lg w-full transition-transform duration-300 hover:scale-[1.01] cursor-pointer"
                                    alt="screenshot"
                                />

                                <div className="mt-3">
                                    <div className="flex justify-between items-center">
                                        <p className="md:text-base text-subTextColor dark:text-darkTextSecondary">
                                            {screenShort.start}
                                        </p>
                                    </div>
                                    <h2 className=" text-sm sm:text-base font-bold text-headingTextColor dark:text-darkTextPrimary">
                                        {screenShort.project}
                                    </h2>
                                    <p className="text-sm sm:text-base text-subTextColor dark:text-darkTextSecondary">
                                        {screenShort.task}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Wrap the modal with AnimatePresence for exit animation */}
            <AnimatePresence>
                {modalOpen && (
                    <ScreenShortsModal
                        screenShorts={dummyScreenShorts}
                        modalOpen={modalOpen}
                        setModalOpen={setModalOpen}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default AllScreenShorts;
