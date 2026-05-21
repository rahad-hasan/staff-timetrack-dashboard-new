"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import Image from "next/image";
import bellIcon from "../../../assets/header/bell.svg";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";
import { useState, useRef } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { readNotifications } from "@/actions/notification/action";
import { toast } from "sonner";
import { INotificationItem } from "@/types/type";
import {
  Check,
  FileText,
  Calendar,
  RefreshCcw,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import BellIcon from "@/components/Icons/BellIcon";
import { getPlainText } from "@/utils/getPlainText";

const CATEGORY_MAP: Record<string, string> = {
  leave: "LEAVE REQUEST",
  meeting: "MEETING",
  task: "TASK UPDATE",
  work_report: "WORK REPORT REMINDER",
};

const Notification = ({ unreadCount, notificationsList }: any) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get Icon based on reason
  const getNotificationIcon = (reason: string) => {
    switch (reason) {
      case "leave":
        return (
          <Calendar className="w-4 h-4 text-gray-500 dark:text-white/80" />
        );
      case "work_report":
        return <FileText className="w-4 h-4 text-orange-500" />;
      case "task":
        return (
          <RefreshCcw className="w-4 h-4 text-gray-500 dark:text-white/80" />
        );
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
  };

  async function onSubmit() {
    if (!scrollContainerRef.current || !notificationsList) return;
    setLoading(true);
    try {
      const container = scrollContainerRef.current;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      const children = Array.from(container.children) as HTMLElement[];

      const visibleIds = notificationsList
        .filter((_: any, index: number) => {
          const child = children[index];
          if (!child) return false;
          const childTop = child.offsetTop;
          const childBottom = childTop + child.offsetHeight;
          return childBottom > containerTop && childTop < containerBottom;
        })
        .map((item: INotificationItem) => item.id);

      if (visibleIds.length === 0) return;

      const res = await readNotifications({ data: { ids: visibleIds } });
      if (res?.success) {
        toast.success(res?.message || "Notifications marked as read");
      }
    } catch (error: any) {
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-[25px] h-[25px] cursor-pointer">
          <Image
            src={bellIcon}
            fill
            className="object-contain bell-icon"
            alt="notification bell"
          />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1.5 w-4 h-4 text-[9px] font-bold text-white bg-red-600 rounded-full flex items-center justify-center border border-white dark:border-red-600">
              {unreadCount}
            </span>
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent
        side={"bottom"}
        align={"center"}
        className="w-80 sm:w-[400px] p-0 mt-2 dark:border-darkBorder overflow-hidden"
      >
        {/* Header Styling aligned with Image */}
        <div className="p-4 flex justify-between items-center bg-white dark:bg-darkSecondaryBg border-b dark:border-darkBorder">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-50 dark:bg-darkPrimaryBg rounded-lg">
              <BellIcon size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-darkTextPrimary">
                Notifications
              </h2>
              <p className="text-xs text-green-500 font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                {unreadCount} unread
              </p>
            </div>
          </div>
          <button
            onClick={onSubmit}
            className="text-gray-500 dark:text-darkTextSecondary dark:hover:text-darkTextPrimary/80 hover:text-headingTextColor/70 text-xs font-semibold cursor-pointer flex items-center gap-1 transition-colors"
          >
            <Check className="w-4 h-4" /> Mark all read
          </button>
        </div>

        {notificationsList?.length ? (
          <div className="">
            <div
              ref={scrollContainerRef}
              className="max-h-[450px] overflow-y-auto"
            >
              {notificationsList?.map((notification: INotificationItem) => (
                <div
                  key={notification?.id}
                  className={`relative flex items-start gap-4 px-3 py-5 border-l-2 transition-all hover:bg-white dark:bg-darkSecondaryBg ${!notification.is_read ? "border-primary bg-gray-50" : "border-transparent opacity-80"}`}
                >
                  {/* Icon Circle */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-2xl bg-white dark:bg-darkPrimaryBg border border-gray-100 dark:border-darkBorder flex items-center justify-center shadow-sm">
                      {getNotificationIcon(notification.reason)}
                    </div>
                    {!notification.is_read && (
                      <span
                        className={`absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full`}
                      ></span>
                    )}
                  </div>

                  <div className="flex-grow space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-darkTextSecondary uppercase bg-slate-100 dark:bg-darkPrimaryBg px-2 py-0.5 rounded">
                        {CATEGORY_MAP[notification.reason] || "GENERAL"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDistanceToNow(
                          parseISO(notification?.created_at),
                          { addSuffix: true },
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Conditional Static Warning Icon like in Image */}
                      {notification.reason === "work_report" && (
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      )}
                      <h3 className="text-sm font-bold text-slate-700 dark:text-darkTextPrimary leading-tight">
                        {notification?.message}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-darkTextSecondary line-clamp-2">
                      {/* Logic for content snippet from 'data' object */}
                      {notification.data?.note
                        ? `Note: ${getPlainText(notification.data.note)}`
                        : `ID: ${notification.data.id} for ${notification.data.name}`}
                    </p>
                  </div>

                  <div className="self-center">
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-0.5 border-t dark:border-darkBorder bg-white dark:bg-darkSecondaryBg">
              <Link href="/notification" onClick={() => setOpen(false)}>
                <div className="w-full text-center text-slate-500 dark:text-darkTextSecondary dark:hover:text-darkTextPrimary/80 font-semibold text-sm py-2 hover:text-headingTextColor/70 transition-colors flex items-center justify-center gap-2">
                  View all notifications <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="p-10 text-center text-gray-400 text-sm">
              No new notifications
            </div>
            <div className="p-0.5 border-t dark:border-darkBorder bg-white dark:bg-darkSecondaryBg">
              <Link href="/notification" onClick={() => setOpen(false)}>
                <div className="w-full text-center text-slate-500 dark:text-darkTextSecondary dark:hover:text-darkTextPrimary/80 font-semibold text-sm py-2 hover:text-headingTextColor/70 transition-colors flex items-center justify-center gap-2">
                  View all notifications <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default Notification;
