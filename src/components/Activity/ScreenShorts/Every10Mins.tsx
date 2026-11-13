"use client";
import { Circle, Keyboard, MousePointer2 } from "lucide-react";
import Image from "next/image";
import { useMemo } from "react";
import { useEvery10MinsLightbox } from "./ScreenshotLightbox";
// import { Dialog, DialogTrigger } from "@/components/ui/dialog";
// import ScreenShortsDeleteReason from "./ScreenShortsDeleteReason";
import DeleteIcon from "@/components/Icons/DeleteIcon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import EmptyTableLogo from "@/assets/empty_table.svg";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { deleteScreenshot } from "@/actions/screenshots/action";
import { actionErrorMessage } from "@/lib/actionErrors";
import { toast } from "sonner";
import ScreenshotImage, { EAGER_SCREENSHOT_TILES } from "./ScreenshotImage";
import { TTimelineDataSlot, TTimelineHourBlock } from "@/types/type";
// import emptyActivity from "../../../assets/empty_activity.png";

// `canDelete` is resolved on the server from the decoded token role plus the
// company's `screenshot_delete_enabled` setting, so the action never flashes
// for members who are not allowed to use it while the client store rehydrates.
const Every10Mins = ({
  data,
  canDelete,
  message,
}: {
  data: TTimelineHourBlock[];
  canDelete: boolean;
  /** Shown in place of the empty-day text: why the API refused the read. */
  message?: string;
}) => {
  // The day's screenshots in order: the lightbox's carousel. The lightbox
  // lives above this view's error boundary, so a failed refresh cannot close
  // it (see ScreenshotLightbox). `data` is empty for a refused read.
  const dayScreenshots = useMemo(
    () =>
      (data ?? []).flatMap((hourGroup) =>
        hourGroup.slots.flatMap((slot) =>
          slot.type === "data" ? slot.details : [],
        ),
      ),
    [data],
  );
  const openScreenshot = useEvery10MinsLightbox(dayScreenshots);
  // The first image tiles in page order fetch at once; the rest as they near
  // the viewport (see ScreenshotImage `load`).
  const eagerSlots = useMemo(
    () =>
      new Set(
        (data ?? [])
          .flatMap((hourGroup) => hourGroup.slots)
          .filter((slot) => slot.type === "data")
          .slice(0, EAGER_SCREENSHOT_TILES)
          .map((slot) => slot.from_time),
      ),
    [data],
  );

  const handleDeleteScreenShot = async (data: TTimelineDataSlot) => {
    const finalData = {
      user_id: data?.details[0]?.user_id,
      from_time: data?.from_time,
      to_time: data?.to_time,
      duration: data?.total_duration,
    };
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
    } catch (error) {
      toast.error(actionErrorMessage(error, "Something went wrong!"), {
        style: {
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
        },
      });
    }
  };

  return (
    <>
      {/* Hours and slots are keyed by their start time, never by position:
          the API only sends hours that have data, so a live re-render can
          shift every later hour by one, and a delete confirmation left open
          at an index was handed, and deleted, another 10-minute block. */}
      {data?.map((hourGroup) => (
        <div key={hourGroup?.slots?.[0]?.from_time ?? hourGroup?.hourLabel}>
          <div className="flex gap-2 sm:gap-3 justify-between items-center h-3">
            <div className="flex items-center gap-2 -ml-1.5">
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
              <span className="font-medium">{hourGroup.totalWorked}</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 pl-4 py-5 border-l dark:border-darkBorder">
            {hourGroup?.slots?.map((block) =>
              block.type === "empty" ? (
                <div key={block.from_time} className=" ">
                  <div className="min-h-10 flex items-center justify-center border border-dashed border-borderColor dark:border-darkBorder rounded-lg bg-gray-50/50 dark:bg-darkSecondaryBg xl:mt-14">
                    {/* <Image src={emptyActivity} alt="No Activity" className="w-full rounded-lg" height={200} width={200} /> */}
                    <span className="text-gray-400 text-sm dark:text-darkTextSecondary">
                      No activity
                    </span>
                  </div>
                </div>
              ) : (
                <div key={block.from_time} className="mb-5">
                  <div className="text-center space-y-1 mb-2">
                    <h2 className="bg-darkTextPrimary dark:bg-darkSecondaryBg py-1 rounded-full text-sm text-headingTextColor dark:text-darkTextPrimary">
                      {block?.details?.[0]?.project_name}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-darkTextSecondary/60">
                      {block?.details?.[0]?.task_name
                        ? block?.details?.[0]?.task_name
                        : "No Task"}
                    </p>
                  </div>
                  <div className="relative dark:bg-darkSecondaryBg overflow-hidden rounded-lg">
                    <div
                      className="relative w-full aspect-[4/2.2] cursor-pointer"
                      onClick={() => openScreenshot(block?.details?.[0])}
                    >
                      <ScreenshotImage
                        src={block?.details?.[0]?.image}
                        alt="screenshot"
                        fill
                        load={eagerSlots.has(block.from_time) ? "eager" : "near"}
                        className="object-cover transition-transform duration-300 hover:scale-[1.05]"
                      />
                    </div>
                    {block?.details?.[0]?.anomaly?.type && (
                      <span className=" absolute top-1 right-1 text-xs px-2 py-0.5 rounded-2xl bg-[#ff4646cc] text-white">
                        {block?.details?.[0]?.anomaly?.type}
                      </span>
                    )}
                    <span className="absolute left-1/2 -translate-x-1/2 -translate-y-[65%] text-[10px] sm:text-xs px-3 py-1 font-semibold rounded-xl shadow bg-white text-headingTextColor/70 dark:bg-darkPrimaryBg dark:text-darkTextPrimary/60">
                      {block?.details?.length} Screens
                    </span>

                    <div className="p-3 space-y-3  border-x border-b border-borderColor dark:border-darkBorder rounded-b-lg">
                      <div className="flex justify-between items-center">
                        <p className="text-xs sm:text-sm font-normal text-subTextColor dark:text-slate-200">
                          {block?.format_from_time} - {block?.format_to_time}
                        </p>
                        {canDelete && (
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

                      <div className="h-1.5 bg-borderColor dark:bg-darkPrimaryBg rounded-full">
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
                              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4.25 h-4.25 bg-linear-to-b from-bgPrimary dark:from-[#dadada] to-[#dfe5fd] dark:to-darkSecondaryBg border-2 border-white dark:border-slate-500  rounded-full flex items-center justify-center">
                                <div
                                  className={`w-1.25 h-1.25 shadow ${
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
                        {/* {formatDuration(block?.total_duration)} minutes */}
                        {block?.total_duration} minutes
                      </p>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      ))}

      {data?.length === 0 && (
        <div className=" 2xl:h-24 text-center">
          <div
            className={`flex flex-col gap-2.5 items-center justify-center py-8 2xl:py-16`}
          >
            <Image
              src={EmptyTableLogo}
              alt="table empty"
              width={120}
              height={120}
            />
            <p className=" sm:text-lg">
              {message || "No Screenshots Available"}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default Every10Mins;
