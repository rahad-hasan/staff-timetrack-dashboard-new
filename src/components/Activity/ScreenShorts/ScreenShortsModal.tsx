/* eslint-disable @typescript-eslint/no-explicit-any */
import { X } from "lucide-react";
import Image from "next/image";

const ScreenShortsModal = ({ selectedImage, modalOpen, setModalOpen }: any) => {
    
    return (
        <div className="fixed inset-0 z-50 bg-[#000000e7] ">
            <div>
                <div className=" flex justify-end my-3 mx-3 cursor-pointer">
                    <X className=" text-white" onClick={() => setModalOpen(!modalOpen)} />

                </div>
                <div className=" flex justify-center">
                    <div className=" w-[60%]">
                        <Image
                            src={selectedImage}
                            width={1000}
                            height={1000}
                            className="rounded-lg w-full transition-transform duration-300 hover:scale-[1.01]"
                            alt="screenshot"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ScreenShortsModal;