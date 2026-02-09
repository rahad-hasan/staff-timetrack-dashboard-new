/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMemo } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  MousePointer2,
  RefreshCcw,
} from "lucide-react";
import { formatTZTimeHM } from "@/utils";
import { ITimeSheetEntry } from "@/types/type";

const ReportDailyTimeSheet = ({
  dailyTimeEntry = [],
}: {
  dailyTimeEntry: ITimeSheetEntry[];
}) => {
  // Time sheet timeline calculations
  const TOTAL_MINUTES_IN_DAY = 24 * 60; // 1440
  const MIN_ENTRY_HEIGHT_PX = 32;

  const timeToMinutes = (timeString: string) => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const decimalHoursToMinutes = (decimalHours: number | null | undefined) => {
    if (decimalHours === null || decimalHours === undefined || Number.isNaN(decimalHours)) {
      return null;
    }
    return Math.round(decimalHours * 60);
  };

  const getEntryMinutes = (entry: ITimeSheetEntry, type: "start" | "end") => {
    const decimalValue = type === "start" ? entry.start : entry.end;
    const decimalMinutes = decimalHoursToMinutes(decimalValue);
    if (decimalMinutes !== null) return decimalMinutes;

    const timeValue = type === "start" ? entry.start_time : entry.end_time;
    return timeToMinutes(formatTZTimeHM(timeValue));
  };

  const clampMinutes = (minutes: number) => {
    if (Number.isNaN(minutes)) return 0;
    return Math.min(Math.max(minutes, 0), TOTAL_MINUTES_IN_DAY);
  };

  const tasksWithLayout = useMemo(() => {
    // dailyTimeEntry is already sorted upstream; keep order as-is.
    const sortedTasks = [...dailyTimeEntry];

    const tracks: any = []; // tracks means columns

    const tasksWithTrack = sortedTasks.map((task) => {
      const currentTaskStart = getEntryMinutes(task, "start");
      const currentTaskEnd = getEntryMinutes(task, "end");
      const clampedStart = clampMinutes(currentTaskStart);
      const fallbackDuration = decimalHoursToMinutes(task.duration) ?? 0;
      const rawDuration =
        currentTaskEnd >= currentTaskStart
          ? currentTaskEnd - currentTaskStart
          : fallbackDuration;
      const durationMinutes = Math.max(rawDuration, 0);
      const cappedDuration = Math.min(
        durationMinutes,
        TOTAL_MINUTES_IN_DAY - clampedStart,
      );
      const displayEnd = clampedStart + cappedDuration;

      let assignedTrackIndex = -1;

      for (let i = 0; i < tracks.length; i++) {
        const laneEndTime = tracks[i];
        if (clampedStart >= laneEndTime) {
          assignedTrackIndex = i;
          tracks[i] = displayEnd;
          break;
        }
      }

      if (assignedTrackIndex === -1) {
        assignedTrackIndex = tracks.length;
        tracks.push(displayEnd);
      }

      return {
        ...task,
        trackIndex: assignedTrackIndex,
        startMinutes: clampedStart,
        durationMinutes: cappedDuration,
      };
    });

    const maxTracks = tracks.length;

    return tasksWithTrack.map((task) => {
      const baseWidth = 100 / maxTracks;

      const heightPx = Math.max(task.durationMinutes, MIN_ENTRY_HEIGHT_PX);
      const maxHeightPx = Math.max(TOTAL_MINUTES_IN_DAY - task.startMinutes, 0);
      const safeHeightPx = Math.min(heightPx, maxHeightPx);

      return {
        ...task,
        // Vertical (Positioning based on minutes converted to %)
        topPosition: (task.startMinutes / TOTAL_MINUTES_IN_DAY) * 100,
        heightPercentage: (safeHeightPx / TOTAL_MINUTES_IN_DAY) * 100,
        // Horizontal (Positioning based on track index)
        leftPercentage: task.trackIndex * baseWidth,
        widthPercentage: baseWidth,
        maxTracks: maxTracks,
      };
    });
  }, [dailyTimeEntry]);

  const timeLineHours = Array.from({ length: 24 }, (_, i) => i);

  const TimelineEntry = ({
    project,
    format_start_time,
    format_end_time,
    topPosition,
    heightPercentage,
    trackIndex,
    maxTracks,
    index,
    format_duration,
    system_update,
    status,
    timeEntry,
    task,
  }: any) => {
    const baseClasses =
      "absolute p-2 text-xs font-medium rounded-lg border-l-4 shadow-lg z-10 transition-all duration-300 hover:shadow-xl";
    // let colorClasses;

    // if (color === 'yellow') {
    //     colorClasses = 'bg-[#fff5db] text-black border-yellow-400';
    // } else {
    //     colorClasses = 'bg-[#fee6eb] text-black border-red-500';
    // }
    const colorClasses =
      index % 2 === 0
        ? "bg-[#fff5db] text-black border-yellow-400"
        : "bg-[#fee6eb] text-black border-red-500";

    const marginLeftPx = trackIndex === 0 ? 1 : 2;
    console.log('This is daily timesheets component');
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={` ${baseClasses} ${colorClasses}`}
            style={{
              top: `${topPosition}%`,
              height: `${heightPercentage}%`,
              left: `calc(${trackIndex * 300}px + ${marginLeftPx}px)`,
              width: `calc(${300}px - ${maxTracks > 1 ? 2 : 0}px)`,
            }}
          >
            <div className="flex items-center">
              <div className="">{project?.name}</div>
              <div className="font-normal text-xs opacity-80 ml-1">
                ( {format_start_time} - {format_end_time} )
              </div>
            </div>
          </div>
        </TooltipTrigger>

        <TooltipContent className=" p-0 overflow-hidden min-w-[240px]">
          <div className="bg-gray-50 dark:bg-darkSecondaryBg px-4 py-3 border-b border-borderColor dark:border-darkBorder">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm text-gray-900 dark:text-darkTextPrimary truncate">
                {project?.name || "No Project"}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-darkTextSecondary mt-0.5 ml-6">
              {task?.name || "No Task Name"}
            </p>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-gray-500 dark:text-darkTextSecondary">
                <Clock className="w-3.5 h-3.5" />
                <span>Duration </span>
              </div>
              <span className="font-semibold text-gray-700 dark:text-darkTextSecondary">
                {format_duration}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-gray-500 dark:text-darkTextSecondary">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Status</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  status === "complete"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {status}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-gray-500 dark:text-darkTextSecondary">
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>App Version</span>
              </div>
              <span className="text-gray-600 dark:text-darkTextSecondary">
                {system_update}
              </span>
            </div>

            <div className="pt-2 border-t border-borderColor dark:border-darkBorder flex items-center gap-2 text-[10px]">
              {timeEntry?.is_manual_entry ? (
                <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Manual Entry
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-primary font-medium">
                  <MousePointer2 className="w-3 h-3" />
                  System Tracked
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="">
      <div className="  overflow-x-auto">
        <div className="flex  pb-2">
          <div className="w-[80px] flex-shrink-0 font-bold text-sm text-subTextColor text-center dark:text-darkTextPrimary">
            Time
          </div>
          <div className="flex-grow font-bold text-sm text-subTextColor ml-4"></div>
        </div>

        <div className="flex min-w-[800px] border-t border-gray-200 dark:border-darkBorder">
          <div className="w-[80px]">
            {timeLineHours.map((hour) => (
              <div
                key={hour}
                className="h-[60px] text-xs font-medium text-gray-500 flex items-center justify-center border-b border-borderColor dark:border-darkBorder dark:text-darkTextSecondary"
              >
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}
          </div>

          <div
            className="flex-grow relative border-l border-gray-200 dark:border-darkBorder "
            style={{ height: `${(TOTAL_MINUTES_IN_DAY / 60) * 60}px` }}
          >
            {timeLineHours.map((hour) => (
              <div
                key={`grid-${hour}`}
                className="absolute left-0 right-0 border-b border-borderColor dark:border-darkBorder"
                style={{
                  top: `${(hour / 24) * 100}%`,
                  height: "60px",
                  zIndex: 0,
                }}
              >
                <div className="h-full"></div>
              </div>
            ))}

            {tasksWithLayout.map((entry, index) => (
              <TimelineEntry key={index} index={index} {...entry} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportDailyTimeSheet;
