import { Circle, Pencil } from "lucide-react";
import screenshort1 from "../../../assets/dashboard/screenshort1.png";
import screenshort2 from "../../../assets/dashboard/screenshort2.png";
import screenshort3 from "../../../assets/dashboard/screenshort3.png";
import Image, { StaticImageData } from "next/image";
import { Slider } from "@/components/ui/slider"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel"
import { useState } from "react";
import ScreenShortsModal from "./ScreenShortsModal";

const Every10Mins = () => {
    console.log('Every10Mins');
    const [selectedImage, setSelectedImage] = useState<string | StaticImageData>();
    const [modalOpen, setModalOpen] = useState<boolean>(false);

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
            start: "9:30 am",
            end: "9:40 am",
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
    ]

    return (
        <>
            {/* map and under map */}
            <div className="">
                <div className=" flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-between sm:items-center">
                    <div className=" flex items-center gap-2">
                        <Circle size={20} className=" text-gray-200" />
                        <p className=" text-subTextColor"> 9:10 am - 10:00 am</p>
                    </div>

                    <h2 className=" text-lg  text-subTextColor">
                        Total time worked: <span className=" font-semibold">1:00:00</span>
                    </h2>
                </div>

                <div className=" mt-1">
                    <Carousel className="w-full ">
                        <CarouselContent className="">
                            {screenShortsTimely.map((screenShort) => (
                                <CarouselItem key={screenShort._id} className=" basis-[70%] sm:basis-[45%] lg:basis-[30%] 2xl:basis-[23%] p-3">
                                    <div className=" p-3 flex-nowrap rounded-lg border border-borderColor cursor-grab">

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
                                                <p className="text-lg text-textGray">
                                                    {screenShort.start} - {screenShort.end}
                                                </p>
                                                <Pencil className="text-primary cursor-pointer" size={18} />
                                            </div>
                                            <p className="mb-2 text-textGray">
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
                                            <h2 className="mt-2 md:text-lg font-semibold">
                                                {screenShort.project}
                                            </h2>
                                            <p className="text-textGray">{screenShort.task}</p>
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div >
            </div>
            {/* map and under map */}
            <div>
                <div className=" flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-between sm:items-center">
                    <div className=" flex items-center gap-2">
                        <Circle size={20} className=" text-gray-200" />
                        <p className=" text-subTextColor"> 10:10 am - 11:10 am</p>
                    </div>

                    <h2 className=" text-lg  text-subTextColor">
                        Total time worked: <span className=" font-semibold">1:00:00</span>
                    </h2>
                </div>

                <div className=" mt-1">
                    <Carousel className="w-full ">
                        <CarouselContent className="">
                            {screenShortsTimely.map((screenShort) => (
                                <CarouselItem key={screenShort._id} className=" basis-[70%] sm:basis-[45%] lg:basis-[30%] 2xl:basis-[23%] p-3">
                                    <div className=" p-3 flex-nowrap rounded-lg border border-borderColor cursor-grab">
                                        <Image
                                            src={screenShort.screenShort}
                                            width={300}
                                            height={300}
                                            className="rounded-lg w-full transition-transform duration-300 hover:scale-[1.01]"
                                            alt="screenshot"
                                        />
                                        <div className="mt-3">
                                            <div className="flex justify-between items-center">
                                                <p className="text-lg text-textGray">
                                                    {screenShort.start} - {screenShort.end}
                                                </p>
                                                <Pencil className="text-primary cursor-pointer" size={18} />
                                            </div>
                                            <p className="mb-2 text-textGray">
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
                                            <h2 className="mt-2 md:text-lg font-semibold">
                                                {screenShort.project}
                                            </h2>
                                            <p className="text-textGray">{screenShort.task}</p>
                                        </div>
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div >
                {
                    modalOpen &&
                    <ScreenShortsModal screenShorts={dummyScreenShorts} modalOpen={modalOpen} setModalOpen={setModalOpen}></ScreenShortsModal>
                }
            </div>
        </>
    );
};

export default Every10Mins;