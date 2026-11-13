import { getLeaveHolidays } from "@/actions/leaves/action";
import { canManageLeave } from "@/lib/leave";
import { getViewerTimeZone } from "@/lib/server/session";
import { todayIn } from "@/lib/timezone";
import { ISearchParamsProps, LeaveHoliday, LeaveHolidayListData } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import HolidayManagementBoard from "./HolidayManagementBoard";

const extractHolidayRows = (holidayData: LeaveHolidayListData | undefined): LeaveHoliday[] => {
  if (Array.isArray(holidayData)) {
    return holidayData;
  }

  if (Array.isArray(holidayData?.holidays)) {
    return holidayData.holidays;
  }

  if (Array.isArray(holidayData?.data)) {
    return holidayData.data;
  }

  return [];
};

const HolidayManagementServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const currentUser = await getDecodedUser();
  // The viewer's year, the one HolidayManagementBoard labels by default — the
  // process's own clock is another zone's year around New Year.
  const selectedYear =
    typeof params.year === "string"
      ? params.year
      : todayIn(await getViewerTimeZone()).slice(0, 4);

  const currentPage =
    typeof params.page === "string" ? Number(params.page) || 1 : 1;

  const holidaysResponse = await getLeaveHolidays({
    year: selectedYear,
    page: currentPage,
    limit: 30,
  });

  return (
    <HolidayManagementBoard
      holidays={extractHolidayRows(holidaysResponse?.data)}
      canManageHolidays={canManageLeave(currentUser?.role)}
      meta={holidaysResponse?.meta ?? { page: 1, limit: 10, total: 10, totalPages: 1 }
      }
    />
  );
};

export default HolidayManagementServer;
