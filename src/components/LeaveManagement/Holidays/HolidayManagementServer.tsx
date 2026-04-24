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

  const holidaysResponse = await getLeaveHolidays({
    year: selectedYear,
  });

  return (
    <HolidayManagementBoard
      holidays={extractHolidayRows(holidaysResponse?.data)}
      canManageHolidays={["admin", "hr"].includes(role)}
    />
  );
};

export default HolidayManagementServer;
