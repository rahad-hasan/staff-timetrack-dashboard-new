/* eslint-disable @typescript-eslint/no-explicit-any */
import { X, Download, ZoomOut, ZoomIn, Fullscreen, MousePointer2, Keyboard, ShieldAlert } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
    Carousel,
    CarouselApi,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { formatTZTime } from "@/utils";

interface ScreenshotDetail {
    project_name: string;
    task_name: string | null;
    user_id: number;
    company_id: number;
    score: number;
    mouse_activity: number;
    keyboard_activity: number;
    duration: number;
    corrupted: string;
    anomaly: any;
    image: string;
    display_name: string;
    time: string;
}

const getSrc = (item: any) => {
    if (typeof item === "string") return item;
    return item;
};

const ScreenShortsModal = ({ screenShorts, modalOpen, setModalOpen }: { screenShorts: ScreenshotDetail[], modalOpen: any, setModalOpen: any }) => {

    const [activeIndex, setActiveIndex] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [api, setApi] = useState<CarouselApi>();
    const modalRef = useRef<HTMLDivElement>(null);

    // Synchronize Carousel state with activeIndex
    useEffect(() => {
        if (!api) return;

        const onSelect = () => {
            setActiveIndex(api.selectedScrollSnap());
        };

        api.on("select", onSelect);
        api.on("reInit", onSelect);

        return () => {
            api.off("select", onSelect);
            api.off("reInit", onSelect);
        };
    }, [api]);

    // Calculate which thumbnails to show (sliding window of 4)
    let start = activeIndex - 1;
    if (start < 0) start = 0;
    if (start > screenShorts.length - 4) start = Math.max(0, screenShorts.length - 4);
    const visibleThumbs = screenShorts.slice(start, start + 4);

    const toggleFullscreen = () => {
        if (!modalRef.current) return;
        if (!document.fullscreenElement) {
            modalRef.current.requestFullscreen().catch(console.error);
        } else {
            document.exitFullscreen();
        }
    };

    const handleDownload = () => {
        const currentItem = screenShorts[activeIndex];
        const src = typeof currentItem?.image === "string" ? currentItem.image : (currentItem?.image as any)?.src;

        if (!src) return;

        const link = document.createElement("a");
        link.href = src;
        link.download = `screenshot-${activeIndex + 1}.png`;
        link.click();
    };

    if (!modalOpen) return null;

    return (
        <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-center items-start xl:items-center"
        >
            <div className="absolute top-5 right-5 flex gap-5 z-50">
                <ZoomOut onClick={() => setZoom(z => Math.max(.75, z - 0.25))} className="text-white cursor-pointer h-8" />
                <ZoomIn onClick={() => setZoom(z => Math.min(1.25, z + 0.25))} className="text-white cursor-pointer h-8" />
                <Fullscreen onClick={toggleFullscreen} className="text-white cursor-pointer h-8" />
                <Download onClick={handleDownload} className="text-white cursor-pointer h-8" />
                <X onClick={() => setModalOpen(false)} className="text-white cursor-pointer h-8" />
            </div>

            <div className="w-full h-full mt-20 lg:mt-10 sm:px-1">
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
                    <CarouselContent className=" h-full">
                        {screenShorts?.map((item: ScreenshotDetail, index: number) => (
                            <CarouselItem key={index} className="flex items-start justify-center relative">
                                <Image
                                    src={getSrc(item?.image)}
                                    width={1400}
                                    height={900}
                                    alt={`screenshot-${index}`}
                                    className=" h-[30vh] md:h-[40vh] lg:h-[50vh] xl:h-[60vh] 2xl:h-[78vh] object-contain"
                                    style={{
                                        transform: `scale(${zoom})`,
                                        transition: "0.25s ease",
                                    }}
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>

                    <div className="hidden sm:block">
                        <CarouselPrevious className="left-0" />
                        <CarouselNext className="right-0" />
                    </div>
                </Carousel>
                <div className="w-full hidden sm:flex flex-wrap justify-center gap-3 px-5 mt-10 mb-5">
                    {visibleThumbs?.map((item, i) => {
                        // Correct index identification
                        const realIndex = screenShorts.indexOf(item);

                        return (
                            <motion.div
                                layout
                                key={`thumb-${realIndex}`}
                                onClick={() => api?.scrollTo(realIndex)}
                                className={`cursor-pointer rounded-md overflow-hidden border-2 transition-all duration-200 
                                    ${realIndex === activeIndex ? "border-primary scale-110 z-10" : "border-transparent opacity-50 hover:opacity-100"}`}
                            >
                                <Image
                                    src={getSrc(item?.image)}
                                    width={120}
                                    height={80}
                                    alt={`thumb-${realIndex}`}
                                    className="rounded-sm object-cover w-[100px] md:w-[130px] h-[60px] md:h-[80px]"
                                />
                            </motion.div>
                        );
                    })}
                </div>
            </div>
            <div className=" w-full flex justify-center items-center">
                <div className="lg:absolute lg:bottom-0 lg:left-6 min-w-[280px] bg-black/80 backdrop-blur-2xl border border-white/20 rounded-xl text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-none p-0 overflow-hidden">
                    {screenShorts[activeIndex]?.corrupted && screenShorts[activeIndex]?.corrupted !== "NONE" && (
                        <div className={`flex items-center gap-2 px-4 py-2 border-b border-white/10 ${screenShorts[activeIndex]?.anomaly?.severity === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            <ShieldAlert size={16} className="animate-pulse" />
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">
                                    {screenShorts[activeIndex]?.anomaly?.type || screenShorts[activeIndex]?.corrupted} Detected
                                </span>
                                {screenShorts[activeIndex]?.anomaly?.reason && (
                                    <span className="text-[12px] opacity-80">{screenShorts[activeIndex]?.anomaly.reason}</span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="p-4">
                        <div className="flex justify-between items-start mb-3">
                            <div className="max-w-[160px]">
                                <h3 className="font-bold text-base ">
                                    {screenShorts[activeIndex]?.project_name}
                                </h3>
                                <p className="text-xs text-primary font-medium mt-0.5 ">
                                    {screenShorts[activeIndex]?.task_name || "No Task Assigned"}
                                </p>
                            </div>
                            <span className="text-[13px] bg-white/10 px-2 py-0.5 rounded border border-white/5">
                                {screenShorts[activeIndex]?.time ? formatTZTime(screenShorts[activeIndex]?.time) : "--:--"}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-[11px] mb-1 uppercase tracking-wider text-white/50 font-semibold">
                                    <span>Efficiency Score</span>
                                    <span className="text-white">{screenShorts[activeIndex]?.score}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full">
                                    <div
                                        className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]"
                                        style={{ width: `${screenShorts[activeIndex]?.score}%` }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center justify-between bg-white/5 border border-white/5 p-2 rounded-lg">
                                    <div className="flex items-center gap-2 text-white/60">
                                        <MousePointer2 size={12} />
                                        <span className="text-[10px] uppercase font-bold">Mouse</span>
                                    </div>
                                    <span className="text-xs font-bold">{screenShorts[activeIndex]?.mouse_activity}%</span>
                                </div>
                                <div className="flex items-center justify-between bg-white/5 border border-white/5 p-2 rounded-lg">
                                    <div className="flex items-center gap-2 text-white/60">
                                        <Keyboard size={12} />
                                        <span className="text-[10px] uppercase font-bold">Keys</span>
                                    </div>
                                    <span className="text-xs font-bold">{screenShorts[activeIndex]?.keyboard_activity}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between opacity-50">
                            <span className="text-[10px] border-white/70">Screen: {screenShorts[activeIndex]?.display_name === "display_one" ? "Display One" : "Display Two"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ScreenShortsModal;
