"use client"
// import { Circle } from "lucide-react";
import screenshort1 from "../../../assets/dashboard/screenshort1.png";
import screenshort2 from "../../../assets/dashboard/screenshort2.png";
import screenshort3 from "../../../assets/dashboard/screenshort3.png";
import Image, { StaticImageData } from "next/image";
import { useState } from "react";
import { AnimatePresence } from 'framer-motion';
import ScreenShortsModal from "./ScreenShortsModal";
import { IAllScreenshot } from "@/types/type";
import { format, parseISO } from "date-fns";

const AllScreenShorts = ({ data }: { data: IAllScreenshot[] | undefined }) => {
    console.log(data);

    const [selectedImage, setSelectedImage] = useState<IAllScreenshot>();
    const [modalOpen, setModalOpen] = useState<boolean>(false);


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
            {/* {screenShortsTimely.map((group, groupIndex) => (
                <div key={groupIndex} className={groupIndex > 0 ? "mt-5" : ""}>
   
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-between sm:items-center">
                        <div className="flex items-center gap-2">
                            <Circle size={20} className="text-gray-200 dark:text-darkTextPrimary" />
                            <p className="text-subTextColor dark:text-darkTextSecondary">{group.time}</p>
                        </div>

                        <h2 className="text-lg text-subTextColor dark:text-darkTextSecondary">
                            Total time worked: <span className="font-medium">{group.totalTimeWorked}</span>
                        </h2>
                    </div> */}

            {/* Screenshot Grid */}
            <div className="mt-3 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {data?.map((screenShort) => (
                    <div
                        key={screenShort?.id}
                        className="p-2 flex-nowrap rounded-lg border border-borderColor dark:border-darkBorder"
                    >
                        <Image
                            src={screenShort?.image}
                            onClick={() => {
                                setSelectedImage(screenShort);
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
                                    {format(parseISO(screenShort?.time), "hh:mm aa")}
                                </p>
                            </div>
                            <h2 className=" text-sm sm:text-base font-bold text-headingTextColor dark:text-darkTextPrimary">
                                {screenShort?.project?.name}
                            </h2>
                            <p className="text-sm sm:text-base text-subTextColor dark:text-darkTextSecondary">
                                {screenShort?.task?.name ? screenShort?.task?.name : "No Task"}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
            {/* </div>
            ))} */}

            {/* Wrap the modal with AnimatePresence for exit animation */}
            {/* <AnimatePresence>
                {
                    modalOpen &&
                    <ScreenShortsModal screenShorts={selectedImage} modalOpen={modalOpen} setModalOpen={setModalOpen}></ScreenShortsModal>
                }
            </AnimatePresence> */}
        </>
    );
};

export default AllScreenShorts;
