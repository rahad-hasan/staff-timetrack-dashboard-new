import { getLeaveHolidays } from "@/actions/leaves/action";
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
  const role = currentUser?.role ?? "";
  const selectedYear =
    typeof params.year === "string" ? params.year : String(new Date().getFullYear());

  const currentPage =
    typeof params.page === "string" ? Number(params.page) || 1 : 1;

  const holidaysResponse = await getLeaveHolidays({
    year: selectedYear,
    page: currentPage,
  });

  return (
    <HolidayManagementBoard
      holidays={extractHolidayRows(holidaysResponse?.data)}
      canManageHolidays={["admin", "hr"].includes(role)}
      meta={holidaysResponse?.meta ?? { page: 1, limit: 10, total: 10, totalPages: 1 }
      }
    />
  );
};

export default HolidayManagementServer;
