/* eslint-disable @typescript-eslint/no-explicit-any */
import { X } from "lucide-react";
import Image from "next/image";
import screenshort1 from "../../../assets/dashboard/screenshort1.png";
import screenshort2 from "../../../assets/dashboard/screenshort2.png";
import screenshort3 from "../../../assets/dashboard/screenshort3.png";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

const ScreenShortsModal = ({ selectedImage, modalOpen, setModalOpen }: any) => {

    return (
        <div className="fixed inset-0 z-50 bg-[#000000e7] ">
            <div>
                <div className=" flex justify-end my-3 mx-3 cursor-pointer">
                    <X className=" text-white" onClick={() => setModalOpen(!modalOpen)} />
                </div>
                <div className=" flex items-center justify-center">
                    <Carousel className=" w-[50%] ">
                        <CarouselContent className="  basis-1/1">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <CarouselItem key={index}>
                                    <Image
                                        src={selectedImage}
                                        width={1000}
                                        height={1000}
                                        className=""
                                        alt="screenshot"
                                    />
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        <CarouselPrevious className=" bg-black hover:bg-black" />
                        <CarouselNext className=" bg-black hover:bg-black" />
                    </Carousel>
                </div>
                {/* indicating images  */}
                <div className=" fixed bottom-10">
                    <div className=" flex justify-center items-center ">
                        <Image
                            src={selectedImage}
                            width={200}
                            height={200}
                            className=""
                            alt="screenshot"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScreenShortsModal;