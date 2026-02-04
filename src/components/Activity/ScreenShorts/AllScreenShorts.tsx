"use client";
// import { Circle } from "lucide-react";
// import screenshort1 from "../../../assets/dashboard/screenshort1.png";
// import screenshort2 from "../../../assets/dashboard/screenshort2.png";
// import screenshort3 from "../../../assets/dashboard/screenshort3.png";
import Image from "next/image";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { IAllScreenshot } from "@/types/type";
import AllScreenShortsModal from "./AllScreenShortsModal";
import EmptyTableLogo from "@/assets/empty_table.svg";
import { formatTZTime } from "@/utils";

const AllScreenShorts = ({ data }: { data: IAllScreenshot[] | undefined }) => {
  const [selectedImage, setSelectedImage] = useState<IAllScreenshot>();
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  return (
    <>
      <div className="mt-3 grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
        {data?.map((screenShort) => (
          <div key={screenShort?.id} className="mb-5">
            <div className="text-center space-y-1 mb-2">
              <h2 className="bg-[#F3F4F6] dark:bg-darkSecondaryBg py-1 rounded-full text-sm text-headingTextColor dark:text-darkTextPrimary">
                {screenShort?.project?.name}
              </h2>
              <p className="text-xs text-slate-500 dark:text-darkTextSecondary/60">
                {screenShort?.task?.name ? screenShort?.task?.name : "No Task"}
              </p>
            </div>
            <div className="relative flex-nowrap rounded-lg dark:bg-darkSecondaryBg ">
              <Image
                src={screenShort?.image}
                onClick={() => {
                  setSelectedImage(screenShort);
                  setModalOpen(true);
                }}
                width={300}
                height={300}
                className="rounded-t-lg w-full max-h-[140px] transition-transform duration-300 hover:scale-[1.01] cursor-pointer"
                alt="screenshot"
              />
              {screenShort?.anomaly?.type && (
                <span className=" absolute top-1 left-1 text-xs px-2 py-0.5 rounded-2xl bg-[#ff4646cc] text-white">
                  {screenShort?.anomaly?.type}
                </span>
              )}
              <span className={` absolute -top-2 -right-1.5 text-sm shadow-md px-2 py-[1px] flex items-center justify-center rounded-2xl ${screenShort?.score > 49 ? "bg-green-400" : screenShort?.score > 15 ? "bg-yellow-500" : "bg-rose-500"} text-white `}>
                {screenShort?.score}%
              </span>

              <div className="px-3 py-3 border-x border-b border-borderColor dark:border-darkBorder rounded-b-lg">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-subTextColor dark:text-darkTextSecondary">
                    {formatTZTime(screenShort?.time)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data?.length === 0 && (
        <div className="h-24 text-center">
          <div
            className={` flex flex-col gap-2.5 items-center justify-center py-16 `}
          >
            <Image
              src={EmptyTableLogo}
              alt="table empty"
              width={120}
              height={120}
            />
            <p className=" sm:text-lg">No Screenshots Available</p>
          </div>
        </div>
      )}
      {/* </div>
            ))} */}

      {/* Wrap the modal with AnimatePresence for exit animation */}
      <AnimatePresence>
        {modalOpen && selectedImage && (
          <AllScreenShortsModal
            screenShorts={data ?? []}
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
            selectedImage={selectedImage}
          ></AllScreenShortsModal>
        )}
      </AnimatePresence>
    </>
  );
};

export default AllScreenShorts;
