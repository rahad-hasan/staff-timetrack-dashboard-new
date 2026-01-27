/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Circle, Keyboard, MousePointer2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import ScreenShortsModal from "./ScreenShortsModal";
// import { Dialog, DialogTrigger } from "@/components/ui/dialog";
// import ScreenShortsDeleteReason from "./ScreenShortsDeleteReason";
import { AnimatePresence } from "framer-motion";
import DeleteIcon from "@/components/Icons/DeleteIcon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import EmptyTableLogo from "@/assets/empty_table.svg";
import { formatTZTime } from "@/utils";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { deleteScreenshot } from "@/actions/screenshots/action";
import { toast } from "sonner";
import { useLogInUserStore } from "@/store/logInUserStore";
// import emptyActivity from "../../../assets/empty_activity.png";

const Every10Mins = ({ data }: any) => {
  const logInUserData = useLogInUserStore((state) => state.logInUserData);
  const [selectedImage, setSelectedImage] = useState<any>();
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    // const seconds = Math.floor(totalSeconds % 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m`;
    }
  };

  const groupDataByHour = (intervals: any[]) => {
    const hours: Record<string, any[]> = {};

    // 1. Group intervals by their hour start (e.g., "2025-12-30T11:00:00")
    intervals?.forEach((interval) => {
      const date = new Date(interval?.from_time);
      date?.setMinutes(0, 0, 0);
      const hourKey = date?.toISOString();
      if (!hours[hourKey]) hours[hourKey] = [];
      hours[hourKey].push(interval);
    });

    return Object.entries(hours)?.map(([hourKey, blockIntervals]) => {
      const hourStart = new Date(hourKey);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourEnd.getHours() + 1);

      // 2. Generate all six 10-minute slots for this hour
      const slots = [];
      let totalWorkedSeconds = 0;

      for (let i = 0; i < 60; i += 10) {
        const slotStart = new Date(hourStart);
        slotStart?.setMinutes(i);
        const slotEnd = new Date(slotStart);
        slotEnd?.setMinutes(i + 10);

        // Find if an interval matches this specific 10m slot
        const match = blockIntervals.find(
          (int) => new Date(int.from_time).getTime() === slotStart.getTime(),
        );

        if (match) {
          totalWorkedSeconds += match.total_duration;
          slots.push({ type: "data", ...match });
        } else {
          slots.push({
            type: "empty",
            from_time: slotStart.toISOString(),
            to_time: slotEnd.toISOString(),
          });
        }
      }

      return {
        hourLabel: `${formatTZTime(hourStart)} - ${formatTZTime(hourEnd)}`,
        totalWorked: totalWorkedSeconds,
        slots,
      };
    });
  };

  const handleDeleteScreenShot = async (data: any) => {
    const finalData = {
      user_id: data?.details[0]?.user_id,
      from_time: data?.from_time,
      to_time: data?.to_time,
    };
    console.log("got data", finalData);
    try {
      const res = await deleteScreenshot({
        data: finalData,
      });

      if (res?.success) {
        toast.success(res?.message || `Deleted screenshots successfully`);
      } else {
        toast.error(res?.message || `Failed to delete screenshots`, {
          style: {
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
          },
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong!", {
        style: {
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
        },
      });
    }
  };

  const processedHours = groupDataByHour(data || []);

  return (
    <>
      {/* <div className="">
                {data?.map((block: any, blockIndex: any) => (
                    <div key={blockIndex} className="mt-5">
 
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-between sm:items-center">
                            <div className="flex items-center gap-2">
                                <Circle size={20} className="text-gray-200 dark:text-darkTextPrimary" />
                                <p className="text-subTextColor dark:text-darkTextSecondary">{format(parseISO(block.from_time), 'h:mm a')} - {format(parseISO(block.to_time), 'h:mm a')}</p>
                            </div>
                            <h2 className="text-lg text-subTextColor dark:text-darkTextSecondary">
                                Total time worked: <span className="font-medium">{formatDuration(block.total_duration)}</span>
                            </h2>
                        </div>
 
                        <div className="mt-3 grid grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6 3xl:grid-cols-6 gap-4">
                            {block?.details.map((screenShort: any, index: any) => (
                                <div
                                    key={index}
                                    className="p-2 flex-nowrap rounded-lg border border-borderColor dark:border-darkBorder"
                                >
                                    <Image
                                        src={screenShort?.image}
                                        onClick={() => {
                                            setSelectedImage(screenShort.screenShort);
                                            setModalOpen(true);
                                        }}
                                        width={300}
                                        height={300}
                                        className="rounded-lg w-full h-34 object-cover transition-transform duration-300 hover:scale-[1.01] cursor-pointer"
                                        alt="screenshot"
                                    />
 
                                    <div className="mt-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className=" text-lg font-normal text-subTextColor dark:text-darkTextPrimary">
                                                {screenShort.start}nai - nai{screenShort.end}
                                            </p>
                                            <Dialog>
                                                <form>
                                                    <DialogTrigger asChild>
                                                        <div className="text-red-500 cursor-pointer">
                                                            <DeleteIcon size={18} />
                                                        </div>
                                                    </DialogTrigger>
                                                    <ScreenShortsDeleteReason></ScreenShortsDeleteReason>
                                                </form>
                                            </Dialog>
                                        </div>
 
                                        <p className=" text-sm mb-2 text-subTextColor dark:text-darkTextPrimary">
                                            {screenShort?.score}% of {screenShort?.duration} minutes
                                        </p>
 
 
                                        <div className="h-2 bg-[#dce3e3] rounded-full">
 
                                            <div
                                                className={`h-2 ${screenShort.score < 30
                                                    ? "bg-red-500"
                                                    : screenShort.score < 60
                                                        ? "bg-yellow-400"
                                                        : "bg-primary"}
                                                     rounded-full relative`}
                                                style={{ width: `${screenShort.score}%` }}
                                            >
 
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[22px] h-[22px] bg-gradient-to-b from-[#ffffff] to-[#dfe5fd] border-2 border-white rounded-full flex items-center justify-center">
                                                    <div className={`w-[8px] h-[8px] shadow ${screenShort.score < 30
                                                        ? "bg-red-500"
                                                        : screenShort.score < 60
                                                            ? "bg-yellow-400"
                                                            : "bg-primary"} rounded-full`}>
                                                    </div>
                                                </div>
                                            </div>
 
                                        </div>
                                        <h2 className="mt-3 text-sm sm:text-base font-bold text-headingTextColor dark:text-darkTextPrimary">
                                            {screenShort?.project_name}
                                        </h2>
                                        <p className="text-subTextColor text-sm md:text-base dark:text-darkTextSecondary">
                                            {screenShort?.task_name ? screenShort?.task_name : "No Task"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div> */}

      {processedHours?.map((hourGroup, groupIdx) => (
        <div key={groupIdx}>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-between sm:items-center h-3">
            <div className="flex items-center gap-2 -ml-[6px]">
              <Circle
                size={12}
                className="text-gray-200 dark:text-darkTextPrimary/50"
              />
              <p className="text-subTextColor dark:text-darkTextSecondary text-sm">
                {hourGroup?.hourLabel}
              </p>
            </div>
            <h2 className="text-sm text-subTextColor dark:text-darkTextSecondary">
              Worked Duration:{" "}
              <span className="font-medium">
                {formatDuration(hourGroup?.totalWorked)}
              </span>
            </h2>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6 3xl:grid-cols-6 gap-4 pl-4 py-5 border-l dark:border-darkBorder">
            {hourGroup?.slots?.map((block: any, blockIndex: any) =>
              block.type === "empty" ? (
                <div key={blockIndex} className=" ">
                  <div className="min-h-10 flex items-center justify-center border border-dashed border-borderColor dark:border-darkBorder rounded-lg bg-gray-50/50 dark:bg-darkSecondaryBg xl:mt-14">
                    {/* <Image src={emptyActivity} alt="No Activity" className="w-full rounded-lg" height={200} width={200} /> */}
                    <span className="text-gray-400 text-sm dark:text-darkTextSecondary">
                      No activity
                    </span>
                  </div>
                </div>
              ) : (
                <div key={blockIndex} className="mb-5">
                  <div className="text-center space-y-1 mb-2">
                    <h2 className="bg-[#F3F4F6] dark:bg-darkSecondaryBg py-1 rounded-full text-sm text-headingTextColor dark:text-darkTextPrimary">
                      {block?.details?.[0]?.project_name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-darkTextSecondary/60">
                      {block?.details?.[0]?.task_name
                        ? block?.details?.[0]?.task_name
                        : "No Task"}
                    </p>
                  </div>
                  <div className="relative flex-nowrap rounded-lg overflow-hidden dark:bg-darkSecondaryBg">
                    <Image
                      src={block?.details?.[0]?.image}
                      onClick={() => {
                        setSelectedImage(block?.details);
                        setModalOpen(true);
                      }}
                      width={300}
                      height={300}
                      className="w-full object-cover transition-transform duration-300 hover:scale-[1.01] cursor-pointer"
                      alt="screenshot"
                    />
                    {block?.details?.[0]?.anomaly?.type && (
                      <span className=" absolute top-1 right-1 text-xs px-2 py-0.5 rounded-2xl bg-[#ff4646cc] text-white">
                        {block?.details?.[0]?.anomaly?.type}
                      </span>
                    )}
                    <span className="absolute left-1/2 -translate-x-1/2 -translate-y-[65%] text-xs px-3 py-1 font-semibold rounded-xl shadow bg-white text-headingTextColor/70 dark:bg-darkPrimaryBg dark:text-darkTextPrimary/60">
                      {block?.details?.length} Screens
                    </span>

                    <div className="p-3 space-y-3  border-x border-b border-borderColor dark:border-darkBorder rounded-b-lg">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-normal text-subTextColor dark:text-slate-200">
                          {formatTZTime(block?.from_time)} -{" "}
                          {formatTZTime(block?.to_time)}
                        </p>
                        {/* <Dialog>
                                                    <form>
                                                        <DialogTrigger asChild>
                                                            <div className="text-rose-600 dark:text-rose-500 cursor-pointer">
                                                                <DeleteIcon size={16} />
                                                            </div>
                                                        </DialogTrigger>
                                                        <ScreenShortsDeleteReason></ScreenShortsDeleteReason>
                                                    </form>
                                                </Dialog> */}
                        {(logInUserData?.role === "admin" ||
                          logInUserData?.role === "manager" ||
                          logInUserData?.role === "hr") && (
                          <ConfirmDialog
                            trigger={
                              <div className="text-rose-600 dark:text-rose-500 cursor-pointer">
                                <DeleteIcon size={16} />
                              </div>
                            }
                            title="Delete the screenshot entry"
                            description="Are you sure you want to delete? This action cannot be undone."
                            confirmText="Confirm"
                            cancelText="Cancel"
                            onConfirm={() => handleDeleteScreenShot(block)}
                          />
                        )}
                      </div>

                      <div className="h-1.5 bg-[#dce3e3] dark:bg-darkPrimaryBg rounded-full">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-1.5 ${
                                block?.avg_score < 30
                                  ? "bg-red-500"
                                  : block?.avg_score < 60
                                    ? "bg-yellow-400"
                                    : "bg-primary"
                              }
                                                                rounded-full relative`}
                              style={{
                                width: `${block?.avg_score < 10 ? block?.avg_score + 5 : block?.avg_score}%`,
                              }}
                            >
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[17px] h-[17px] bg-gradient-to-b from-[#ffffff] dark:from-[#dadada] to-[#dfe5fd] dark:to-darkSecondaryBg border-2 border-white dark:border-slate-500  rounded-full flex items-center justify-center">
                                <div
                                  className={`w-[5px] h-[5px] shadow ${
                                    block?.avg_score < 30
                                      ? "bg-red-500"
                                      : block?.avg_score < 60
                                        ? "bg-yellow-400"
                                        : "bg-primary"
                                  } rounded-full`}
                                ></div>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="p-3 w-56">
                            <div className="space-y-3">
                              <h4 className="text-xs font-semibold text-subTextColor/60 dark:text-darkTextPrimary/40 uppercase tracking-wider">
                                Activity Breakdown
                              </h4>

                              <div className="space-y-1">
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-subTextColor dark:text-darkTextSecondary">
                                      Avg. Performance
                                    </span>
                                    <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                                      {block?.avg_score}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                      className={`h-1.5 ${
                                        block?.avg_score < 30
                                          ? "bg-red-500"
                                          : block?.avg_score < 60
                                            ? "bg-yellow-400"
                                            : "bg-primary"
                                      }
                                                                    rounded-full relative`}
                                      style={{ width: `${block.avg_score}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5 text-subTextColor dark:text-darkTextSecondary">
                                    <MousePointer2 size={12} />
                                    <span>Mouse</span>
                                  </div>
                                  <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                                    {block.avg_mouse_activity}%
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5 text-subTextColor dark:text-darkTextSecondary">
                                    <Keyboard size={12} />
                                    <span>Keyboard</span>
                                  </div>
                                  <span className="font-medium text-headingTextColor dark:text-darkTextPrimary">
                                    {block.avg_keyboard_activity}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      <p className="text-xs text-subTextColor dark:text-darkTextSecondary text-center">
                        {block?.avg_score}% of{" "}
                        {formatDuration(block?.total_duration)} minutes
                      </p>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      ))}

      {processedHours?.length === 0 && (
        <div className=" 2xl:h-24 text-center">
          <div
            className={` flex flex-col gap-2.5 items-center justify-center py-8 2xl:py-16 `}
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

      <AnimatePresence>
        {modalOpen && (
          <ScreenShortsModal
            screenShorts={selectedImage}
            modalOpen={modalOpen}
            setModalOpen={setModalOpen}
          ></ScreenShortsModal>
        )}
      </AnimatePresence>
    </>
  );
};

export default Every10Mins;
