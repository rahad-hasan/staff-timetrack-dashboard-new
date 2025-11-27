import { Circle, Trash2 } from "lucide-react";
import screenshort1 from "../../../assets/dashboard/screenshort1.png";
import screenshort2 from "../../../assets/dashboard/screenshort2.png";
import screenshort3 from "../../../assets/dashboard/screenshort3.png";
import Image, { StaticImageData } from "next/image";
import { Slider } from "@/components/ui/slider"
// import {
//     Carousel,
//     CarouselContent,
//     CarouselItem,
// } from "@/components/ui/carousel"
import { useState } from "react";
import ScreenShortsModal from "./ScreenShortsModal";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import ScreenShortsDeleteReason from "./ScreenShortsDeleteReason";
import { AnimatePresence } from "framer-motion";

const Every10Mins = () => {
    console.log('Every10Mins');
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

    interface IScreenShortsTimely {
        time: string;
        totalTimeWorked: string;
        allScreenshorts: IScreenShort[];
    }

    const screenShortsTimely: IScreenShortsTimely[] = [
        {
            time: "9:10 am - 10:00 am",
            totalTimeWorked: "1:00:00",
            allScreenshorts: [
                {
                    _id: 1,
                    start: "9:00 am",
                    end: "9:10 am",
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
                    start: "9:10 am",
                    end: "9:20 am",
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
                    start: "9:20 am",
                    end: "9:30 am",
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
                    start: "9:10 am",
                    end: "9:20 am",
                    duration: "10 minutes",
                    progress: 49,
                    activity: 70,
                    screenshotCount: 3,
                    screenShort: screenshort2,
                    project: "Orbit Technology's Project",
                    task: "No Task",
                },
                {
                    _id: 5,
                    start: "9:00 am",
                    end: "9:10 am",
                    duration: "10 minutes",
                    progress: 20,
                    activity: 45,
                    screenshotCount: 3,
                    screenShort: screenshort1,
                    project: "Orbit Technology's Project",
                    task: "No Task",
                },
                {
                    _id: 6,
                    start: "9:20 am",
                    end: "9:30 am",
                    duration: "10 minutes",
                    progress: 80,
                    activity: 25,
                    screenshotCount: 0,
                    screenShort: screenshort1,
                    project: "No Activity Listed",
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
                    start: "10:00 am",
                    end: "10:10 am",
                    duration: "10 minutes",
                    progress: 25,
                    activity: 65,
                    screenshotCount: 3,
                    screenShort: screenshort3,
                    project: "Orbit Technology's Project",
                    task: "No Task",
                },
                {
                    _id: 2,
                    start: "10:10 am",
                    end: "10:20 am",
                    duration: "10 minutes",
                    progress: 40,
                    activity: 55,
                    screenshotCount: 3,
                    screenShort: screenshort2,
                    project: "Orbit Technology's Project",
                    task: "No Task",
                },
                {
                    _id: 3,
                    start: "9:20 am",
                    end: "9:30 am",
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
                    start: "9:10 am",
                    end: "9:20 am",
                    duration: "10 minutes",
                    progress: 49,
                    activity: 70,
                    screenshotCount: 3,
                    screenShort: screenshort2,
                    project: "Orbit Technology's Project",
                    task: "No Task",
                },
                {
                    _id: 5,
                    start: "9:00 am",
                    end: "9:10 am",
                    duration: "10 minutes",
                    progress: 20,
                    activity: 45,
                    screenshotCount: 3,
                    screenShort: screenshort1,
                    project: "Orbit Technology's Project",
                    task: "No Task",
                },
                {
                    _id: 6,
                    start: "9:20 am",
                    end: "9:30 am",
                    duration: "10 minutes",
                    progress: 80,
                    activity: 25,
                    screenshotCount: 0,
                    screenShort: screenshort1,
                    project: "No Activity Listed",
                    task: "No Task",
                },
            ],
        },
    ];

    // assume I have many screenShorts
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
            screenShort: screenshort3
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
            {/* map and under map */}


            {/* 
                <div className=" mt-1">
                    <Carousel className="w-full ">
                        <CarouselContent className="">
                            {screenShortsTimely.map((screenShort) => (
                                <CarouselItem key={screenShort._id} className=" basis-[70%] sm:basis-[45%] lg:basis-[30%] 2xl:basis-[23%] p-3">
                                    <div className=" p-3 flex-nowrap rounded-lg border border-borderColor dark:border-darkBorder cursor-grab">

                                        <Image
                                            src={screenShort.screenShort}
                                            onClick={() => {
                                                setSelectedImage(screenShort.screenShort)
                                                setModalOpen(!modalOpen)
                                            }}
                                            width={300}
                                            height={300}
                                            className="rounded-lg w-full transition-transform duration-300 hover:scale-[1.01]"
                                            alt="screenshot"
                                        />


                                        <div className="mt-3">
                                            <div className="flex justify-between items-center">
                                                <p className="text-lg text-headingTextColor dark:text-darkTextPrimary">
                                                    {screenShort.start} - {screenShort.end}
                                                </p>
                                                <Pencil className="text-primary cursor-pointer" size={18} />
                                            </div>
                                            <p className="mb-2 text-headingTextColor dark:text-darkTextPrimary">
                                                {screenShort.activity}% of 10 minutes
                                            </p>
                                            <Slider
                                                className={`
                                            rounded-full
                                            ${screenShort.progress < 30
                                                        ? "bg-red-500 border-white"
                                                        : screenShort.progress < 60
                                                            ? "bg-yellow-400 border-white"
                                                            : "bg-primary border-white"
                                                    }
                                            `}
                                                disabled
                                                defaultValue={[screenShort.progress ?? 0]}
                                                max={100}
                                                step={1}
                                            />
                                            <h2 className="mt-2 md:text-lg font-medium dark:text-darkTextPrimary">
                                                {screenShort.project}
                                            </h2>
                                            <p className="text-headingTextColor dark:text-darkTextPrimary">{screenShort.task}</p>
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div > */}

            <div className="">
                {screenShortsTimely.map((block, blockIndex) => (
                    <div key={blockIndex} className="mt-5">
                        {/* Header (time and total worked) */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-between sm:items-center">
                            <div className="flex items-center gap-2">
                                <Circle size={20} className="text-gray-200 dark:text-darkTextPrimary" />
                                <p className="text-subTextColor dark:text-darkTextSecondary">{block.time}</p>
                            </div>
                            <h2 className="text-lg text-subTextColor dark:text-darkTextSecondary">
                                Total time worked: <span className="font-medium">{block.totalTimeWorked}</span>
                            </h2>
                        </div>

                        {/* Screenshot grid */}
                        <div className="mt-3 grid grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6 3xl:grid-cols-6 gap-4">
                            {block.allScreenshorts.map((screenShort) => (
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
                                            <p className="text-sm sm:text-base text-headingTextColor dark:text-darkTextPrimary">
                                                {screenShort.start} - {screenShort.end}
                                            </p>
                                            <Dialog>
                                                <form>
                                                    <DialogTrigger asChild>
                                                        <Trash2 className="text-red-500 cursor-pointer" size={18} />
                                                    </DialogTrigger>
                                                    <ScreenShortsDeleteReason></ScreenShortsDeleteReason>
                                                </form>
                                            </Dialog>
                                        </div>

                                        <p className="mb-2 text-sm sm:text-base text-headingTextColor dark:text-darkTextPrimary">
                                            {screenShort.activity}% of 10 minutes
                                        </p>

                                        <Slider
                                            className={`
                                            rounded-full
                                            ${screenShort.progress < 30
                                                    ? "bg-red-500"
                                                    : screenShort.progress < 60
                                                        ? "bg-yellow-400"
                                                        : "bg-primary"}
                                                        `}
                                            disabled
                                            defaultValue={[screenShort.progress ?? 0]}
                                            max={100}
                                            step={1}
                                        />

                                        <h2 className="mt-2 text-sm sm:text-base font-medium text-headingTextColor dark:text-darkTextPrimary">
                                            {screenShort.project}
                                        </h2>
                                        <p className="text-subTextColor text-sm sm:text-base dark:text-darkTextSecondary">
                                            {screenShort.task}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <AnimatePresence>
                {
                    modalOpen &&
                    <ScreenShortsModal screenShorts={dummyScreenShorts} modalOpen={modalOpen} setModalOpen={setModalOpen}></ScreenShortsModal>
                }
            </AnimatePresence>
        </>
    );
};

export default Every10Mins;