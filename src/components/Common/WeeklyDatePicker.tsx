"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import React, { useCallback } from "react";
import CalendarIcon from "../Icons/CalendarIcon";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTopLoader } from "nextjs-toploader";

const WeeklyDatePicker = () => {
  // const router = useRouter();
  // const searchParams = useSearchParams();
  // const pathname = usePathname();
  // const loader = useTopLoader();

  // // 1. Initialize state. If from_date exists in URL, use it.
  // // Otherwise, use null initially to avoid hydration mismatch, then set to today in useEffect.
  // const [centerDate, setCenterDate] = useState<Date | null>(null);

  // // Initial mount logic to set default date
  // useEffect(() => {
  //   const startDateParam = searchParams.get("from_date");
  //   if (startDateParam) {
  //     setCenterDate(new Date(startDateParam));
  //   } else {
  //     setCenterDate(new Date());
  //   }
  // }, []); // Only runs once on mount

  // const getWeekRange = (date: Date | null) => {
  //   if (!date) return { startOfWeek: null, endOfWeek: null };

  //   const workingDate = new Date(date.getTime());
  //   const dayOfWeek = workingDate.getDay();

  //   // Monday as start of week logic
  //   const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  //   const startOfWeek = new Date(
  //     workingDate.setDate(workingDate.getDate() - diffToMonday),
  //   );
  //   startOfWeek.setHours(0, 0, 0, 0);

  //   const endOfWeek = new Date(startOfWeek);
  //   endOfWeek.setDate(startOfWeek.getDate() + 6);
  //   endOfWeek.setHours(23, 59, 59, 999);

  //   return { startOfWeek, endOfWeek };
  // };

  // const { startOfWeek, endOfWeek } = useMemo(
  //   () => getWeekRange(centerDate),
  //   [centerDate],
  // );

  // useEffect(() => {
  //   if (!startOfWeek || !endOfWeek) return;

  //   const params = new URLSearchParams(searchParams.toString());

  //   const formatDateToISO = (date: Date) => {
  //     const yyyy = date.getFullYear();
  //     const mm = String(date.getMonth() + 1).padStart(2, "0");
  //     const dd = String(date.getDate()).padStart(2, "0");
  //     return `${yyyy}-${mm}-${dd}`;
  //   };

  //   const startStr = formatDateToISO(startOfWeek);
  //   const endStr = formatDateToISO(endOfWeek);

  //   if (
  //     params.get("from_date") !== startStr ||
  //     params.get("to_date") !== endStr
  //   ) {
  //     params.set("from_date", startStr);
  //     params.set("to_date", endStr);
  //     params.delete("date"); // Clear daily param if switching modes

  //     // Use replace instead of push for the initial default set
  //     // so the user can still use the "Back" button effectively.
  //     router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  //   }
  // }, [startOfWeek, endOfWeek, pathname, router, searchParams]);

  // const formatDate = (date: Date | null) => {
  //   if (!date) return "Loading...";
  //   return date.toLocaleDateString("en-US", {
  //     weekday: "short",
  //     month: "short",
  //     day: "numeric",
  //     year: "numeric",
  //   });
  // };

  // const handleNavigate = useCallback((weeks: number) => {
  //   setCenterDate((prevDate) => {
  //     if (!prevDate) return new Date();
  //     const newDate = new Date(prevDate);
  //     newDate.setDate(newDate.getDate() + weeks * 7);
  //     loader.start();
  //     return newDate;
  //   });
  // }, []);

  // const dateDisplay = centerDate
  //   ? `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`
  //   : "Loading Week...";

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const loader = useTopLoader();

  const formatDateToISO = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const getWeekRange = (baseDate: Date) => {
    const workingDate = new Date(baseDate.getTime());
    const dayOfWeek = workingDate.getDay();
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const start = new Date(workingDate);
    start.setDate(workingDate.getDate() - diffToMonday);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const fromParam = searchParams.get("from_date");
  const currentBaseDate = fromParam ? new Date(fromParam) : new Date();
  const { start, end } = getWeekRange(currentBaseDate);

  const handleNavigate = useCallback(
    (weeks: number) => {
      const newStartDate = new Date(start);
      newStartDate.setDate(newStartDate.getDate() + weeks * 7);

      const { start: newStart, end: newEnd } = getWeekRange(newStartDate);
      // const params = new URLSearchParams(searchParams.toString());
      const params = new URLSearchParams(window.location.search);
      params.set("from_date", formatDateToISO(newStart));
      params.set("to_date", formatDateToISO(newEnd));
      params.delete("date");

      loader.start();
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [start, searchParams, pathname, router, loader]
  );

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex items-center">
      <ChevronLeft
        onClick={() => handleNavigate(-1)}
        className="border p-2.5 w-10 h-10 dark:bg-darkPrimaryBg border-borderColor dark:border-darkBorder text-headingTextColor dark:text-darkTextPrimary rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-darkSecondaryBg"
      />

      <div className="flex h-10 items-center text-primary gap-2 border dark:border-darkBorder dark:bg-darkPrimaryBg rounded-md px-2 sm:px-4 mx-2">
        <CalendarIcon size={20} />
        <span className="text-xs sm:text-sm 2xl:text-base font-medium text-headingTextColor dark:text-darkTextPrimary whitespace-nowrap">
          {formatDate(start)} - {formatDate(end)}
        </span>
      </div>

      <ChevronRight
        onClick={() => handleNavigate(1)}
        className="border p-2.5 w-10 h-10 dark:bg-darkPrimaryBg border-borderColor dark:border-darkBorder text-headingTextColor dark:text-darkTextPrimary rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-darkSecondaryBg"
      />
    </div>
  );
};

export default React.memo(WeeklyDatePicker);
