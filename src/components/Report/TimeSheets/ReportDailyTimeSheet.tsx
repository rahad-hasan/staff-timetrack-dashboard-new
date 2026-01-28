/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import SelectUserDropDown from "@/components/Common/SelectUserDropDown";
import SpecificDatePicker from "@/components/Common/SpecificDatePicker";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useMemo, useState } from "react";
import { differenceInMinutes } from "date-fns";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  MousePointer2,
  RefreshCcw,
} from "lucide-react";
import { formatTZTime, formatTZTimeHM } from "@/utils";
import { getMembersDashboard } from "@/actions/members/action";

const ReportDailyTimeSheet = ({ dailyTimeEntry }: any) => {
  const taskEntries = dailyTimeEntry?.data ?? [];

  const [users, setUsers] = useState<any>([]);

  useEffect(() => {
    const getMembers = async () => {
      const res = await getMembersDashboard();

      const users = res.data.map((u) => ({
        id: String(u.id),
        label: u.name,
        avatar: u.image || "",
      }));

      setUsers(users);
    };

    getMembers();
  }, []);

  // Time sheet timeline calculations
  const TOTAL_MINUTES_IN_DAY = 24 * 60; // 1440

  const timeToMinutes = (timeString: string) => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const getDurationMinutes = (start_time: string, end_time: string) => {
    return (
      timeToMinutes(formatTZTimeHM(end_time)) -
      timeToMinutes(formatTZTimeHM(start_time))
    );
  };

  const tasksWithLayout = useMemo(() => {
    const sortedTasks = [...taskEntries].sort(
      (a, b) =>
        // timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
        timeToMinutes(formatTZTimeHM(a.start_time)) -
        timeToMinutes(formatTZTimeHM(b.start_time)),
    );

    const tracks: any = []; // tracks means columns

    const tasksWithTrack = sortedTasks.map((task) => {
      const currentTaskStart = timeToMinutes(formatTZTimeHM(task.start_time));
      const currentTaskEnd = timeToMinutes(formatTZTimeHM(task.end_time));

      let assignedTrackIndex = -1;

      for (let i = 0; i < tracks.length; i++) {
        const laneEndTime = tracks[i];
        if (currentTaskStart >= laneEndTime) {
          assignedTrackIndex = i;
          tracks[i] = currentTaskEnd;
          break;
        }
      }

      if (assignedTrackIndex === -1) {
        assignedTrackIndex = tracks.length;
        tracks.push(currentTaskEnd);
      }

      return {
        ...task,
        trackIndex: assignedTrackIndex,
        startMinutes: currentTaskStart,
        durationMinutes: getDurationMinutes(task.start_time, task.end_time),
      };
    });

    const maxTracks = tracks.length;

    return tasksWithTrack.map((task) => {
      const baseWidth = 100 / maxTracks;

      return {
        ...task,
        // Vertical (Positioning based on minutes converted to %)
        topPosition: (task.startMinutes / TOTAL_MINUTES_IN_DAY) * 100,
        heightPercentage: (task.durationMinutes / TOTAL_MINUTES_IN_DAY) * 100,
        // Horizontal (Positioning based on track index)
        leftPercentage: task.trackIndex * baseWidth,
        widthPercentage: baseWidth,
        maxTracks: maxTracks,
      };
    });
  }, [taskEntries]);

  const timeLineHours = Array.from({ length: 24 }, (_, i) => i);

  const TimelineEntry = ({
    project,
    start_time,
    end_time,
    topPosition,
    heightPercentage,
    leftPercentage,
    widthPercentage,
    trackIndex,
    maxTracks,
    index,
    duration,
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

    const formattedStartTime = formatTZTime(start_time);
    const formattedEndTime = formatTZTime(end_time);
    const marginLeftPx = trackIndex === 0 ? 1 : 2;

    // return (
    //     <div
    //         className={`flex flex-col ${baseClasses} ${colorClasses}`}
    //         style={{
    //             top: `${topPosition}%`,
    //             height: `${heightPercentage}%`,
    //             left: `calc(${leftPercentage}% + ${marginLeftPx}px)`,
    //             width: `calc(${widthPercentage}% - ${maxTracks > 1 ? 2 : 0}px)`,
    //             minHeight: '2rem'
    //         }}
    //     >
    //         <div className="">{project}</div>
    //         <div className="font-normal text-base opacity-80 mt-1">
    //             {formattedstart_time} - {formattedEndTime}
    //         </div>
    //     </div>
    // );

    const formatTimeDuration = (
      startTime: string | number | Date,
      endTime: string | number | Date,
    ) => {
      const mins = differenceInMinutes(new Date(endTime), new Date(startTime));
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return h > 0 ? `${h}:${m.toString().padStart(2, "0")}h` : `${m}m`;
    };

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
              minHeight: "2rem",
            }}
          >
            <div className="flex items-center">
              <div className="">{project?.name}</div>
              <div className="font-normal text-xs opacity-80 ml-1">
                ( {formattedStartTime} - {formattedEndTime} )
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
                {" "}
                {formatTimeDuration(start_time, end_time)}
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
      <div className="mb-5 flex flex-col gap-4 sm:gap-0 sm:flex-row justify-between">
        <SpecificDatePicker></SpecificDatePicker>
        <SelectUserDropDown users={users}></SelectUserDropDown>
      </div>

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
