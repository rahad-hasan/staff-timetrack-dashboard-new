/* eslint-disable @typescript-eslint/no-explicit-any */
import { X, Download, ChevronLeft, ChevronRight, ZoomOut, ZoomIn, Fullscreen } from "lucide-react";
import Image, { StaticImageData } from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion } from 'framer-motion';

const TestScreenModal = ({ screenShorts, modalOpen, setModalOpen }: any) => {
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [zoom, setZoom] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    const handleDownload = () => {
        const currentImage = screenShorts[activeIndex]?.screenShort;
        if (!currentImage) return;

        const link = document.createElement("a");
        link.href = typeof currentImage === "string" ? currentImage : currentImage.src;
        link.download = `screenshot-${activeIndex + 1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleThumbClick = (index: number) => {
        setActiveIndex(index);
        setZoom(1);
    };

    const handlePrev = () => {
        setActiveIndex((prev) => (prev - 1 + screenShorts.length) % screenShorts.length);
        setZoom(1);
    };

    const handleNext = () => {
        setActiveIndex((prev) => (prev + 1) % screenShorts.length);
        setZoom(1);
    };
    const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 3));
    const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 1));

    // Updated toggleFullscreen function to use the Fullscreen API
    const toggleFullscreen = () => {
        if (!modalRef.current) return;

        if (!document.fullscreenElement) {
            // Enter Fullscreen
            modalRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
            setIsFullscreen(true);
        } else {
            // Exit Fullscreen
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Effect to listen for fullscreen changes (e.g., when the user presses ESC)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    // If the modal is not open, don't render anything
    if (!modalOpen) return null;

    return (

            <motion.div
                ref={modalRef}
                className="fixed inset-0 z-50 bg-[#000000e7]"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
            >

                {/* Close Button */}
                <div className=" px-5 mt-5 md:mt-4 flex justify-between items-center">
                    <div>

                    </div>
                    <div className=" flex gap-5 items-center">
                        <ZoomOut onClick={handleZoomOut} className="text-white cursor-pointer h-8  z-50" />
                        <ZoomIn onClick={handleZoomIn} className="text-white cursor-pointer h-8 z-50" />
                        <Fullscreen onClick={toggleFullscreen} className="text-white cursor-pointer h-8 z-50" />
                        <Download onClick={handleDownload} className="text-white cursor-pointer h-8 z-50" />
                        <X className=" text-white cursor-pointer h-8 z-50" onClick={() => setModalOpen(!modalOpen)} />
                    </div>

                </div>
                <div className=" w-full h-full lg:h-[90vh] flex flex-col justify-center">

                    <div className="flex flex-col items-center justify-center relative">
                        <div className=" lg:w-[50%] ">
                            <Image
                                src={
                                    typeof screenShorts[activeIndex]?.screenShort === "string"
                                        ? screenShorts[activeIndex].screenShort
                                        : screenShorts[activeIndex].screenShort.src
                                }
                                style={{
                                    transform: `scale(${zoom})`,
                                    transition: "transform 0.3s ease",
                                    cursor: zoom > 1 ? "move" : "default",
                                }}
                                width={1000}
                                height={1000}
                                className="rounded-lg transition-all duration-300 w-full md:w-auto"
                                alt={`screenshot-${activeIndex + 1}`}
                            />


                            <button
                                onClick={handlePrev}
                                className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/70 text-white p-2 rounded-r-md hover:bg-black transition cursor-pointer"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/70 text-white p-2 rounded-l-md hover:bg-black transition cursor-pointer"
                            >
                                <ChevronRight className="w-8 :h-8" />
                            </button>
                        </div>

                    </div>
                    {/* Thumbnails */}
                    <div className="mt-16 w-full flex flex-wrap justify-center gap-3 px-5">
                        {screenShorts.map(
                            (img: { screenShort: string | StaticImageData }, index: number) => (
                                <div
                                    key={index}
                                    onClick={() => handleThumbClick(index)}
                                    className={`cursor-pointer rounded-md overflow-hidden border-2 transition-all duration-200 ${index === activeIndex
                                        ? "border-primary scale-105"
                                        : "border-transparent opacity-70 hover:opacity-100"
                                        }`}
                                >
                                    <Image
                                        src={img.screenShort}
                                        width={100}
                                        height={100}
                                        alt={`thumb-${index + 1}`}
                                        className=" w-[100px] md:w-[150px] rounded-md"
                                    />
                                </div>
                            )
                        )}
                    </div>
                </div>

            </motion.div>

    );
};

export default TestScreenModal;
