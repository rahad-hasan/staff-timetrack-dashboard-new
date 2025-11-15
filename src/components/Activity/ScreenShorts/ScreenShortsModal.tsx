/* eslint-disable @typescript-eslint/no-explicit-any */
import { X, Download, ZoomOut, ZoomIn, Fullscreen } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import { useRef, useState } from "react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

type ScreenShortType = string | StaticImageData | { screenShort: string | StaticImageData };

const getSrc = (item: ScreenShortType): string | StaticImageData => {
    if (typeof item === "string") return item;
    if ("screenShort" in item) return item.screenShort;
    return item;
};

const ScreenShortsModal = ({ screenShorts, modalOpen, setModalOpen }: any) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [api, setApi] = useState<any>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const toggleFullscreen = () => {
        if (!modalRef.current) return;

        if (!document.fullscreenElement) {
            modalRef.current.requestFullscreen().catch(console.error);
        } else {
            document.exitFullscreen();
        }
    };

    const handleDownload = () => {
        const src = getSrc(screenShorts[activeIndex]);
        const url = typeof src === "string" ? src : src.src;
        const link = document.createElement("a");
        link.href = url;
        link.download = `screenshot-${activeIndex + 1}.png`;
        link.click();
    };

    if (!modalOpen) return null;

    return (
        <div
            ref={modalRef}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-center items-center"
        >
            <div className="absolute top-5 right-5 flex gap-5">
                <ZoomOut onClick={() => setZoom(z => Math.max(1, z - 0.25))} className="text-white cursor-pointer h-8" />
                <ZoomIn onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="text-white cursor-pointer h-8" />
                <Fullscreen onClick={toggleFullscreen} className="text-white cursor-pointer h-8" />
                <Download onClick={handleDownload} className="text-white cursor-pointer h-8" />
                <X onClick={() => setModalOpen(false)} className="text-white cursor-pointer h-8" />
            </div>

            <div className="w-full px-10 sm:px-16 mt-10">
                <Carousel
                    opts={{ loop: true, align: "center" }}
                    setApi={(inst) => {
                        if (!inst) return;
                        setApi(inst);
                        inst.on("select", () => {
                            setActiveIndex(inst.selectedScrollSnap());
                        });
                    }}
                >
                    <CarouselContent>
                        {screenShorts.map((item: ScreenShortType, index: number) => (
                            <CarouselItem key={index} className="flex justify-center">
                                <Image
                                    src={getSrc(item)}
                                    width={1400}
                                    height={900}
                                    alt={`screenshot-${index}`}
                                    className="rounded-xl max-h-[78vh] object-contain"
                                    style={{
                                        transform: `scale(${zoom})`,
                                        transition: "0.25s ease",
                                    }}
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    <CarouselPrevious className="bg-black/40 text-white w-10 h-10 hover:bg-black/60 border-none" />
                    <CarouselNext className="bg-black/40 text-white w-10 h-10 hover:bg-black/60 border-none" />
                </Carousel>
            </div>

            <div className="w-full flex flex-wrap justify-center gap-3 px-5 mt-10 mb-5">
                {screenShorts.map((item: ScreenShortType, index: number) => (
                    <div
                        key={index}
                        onClick={() => {
                            setActiveIndex(index);
                            api?.scrollTo(index);
                        }}
                        className={`cursor-pointer rounded-md overflow-hidden border-2 transition-all duration-200 
                            ${index === activeIndex ? "border-primary scale-105" : "border-transparent opacity-70 hover:opacity-100"}
                        `}
                    >
                        <Image
                            src={getSrc(item)}
                            width={120}
                            height={80}
                            alt={`thumb-${index}`}
                            className="rounded-md object-cover w-[100px] md:w-[130px]"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScreenShortsModal;
