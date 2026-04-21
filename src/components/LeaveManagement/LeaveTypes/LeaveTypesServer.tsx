import { getLeaveDetails, getLeaveHolidays, getLeaveTypes } from "@/actions/leaves/action";
import {
  ILeaveDetailsResponse,
  ISearchParamsProps,
  LeaveHoliday,
  LeaveHolidayListData,
} from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import LeaveTypesBoard from "./LeaveTypesBoard";

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

const normalizeLeaveDetails = (
  detailsData: ILeaveDetailsResponse | undefined,
  fallbackYear: number,
): ILeaveDetailsResponse => ({
  data: Array.isArray(detailsData?.data) ? detailsData.data : [],
  details: {
    year: detailsData?.details?.year ?? fallbackYear,
    leave_types: Array.isArray(detailsData?.details?.leave_types)
      ? detailsData.details.leave_types
      : [],
  },
});

const LeaveTypesServer = async ({ searchParams }: ISearchParamsProps) => {
  const params = await searchParams;
  const currentUser = await getDecodedUser();
  const role = currentUser?.role ?? "";
  const fallbackYear =
    typeof params.year === "string" ? Number(params.year) || new Date().getFullYear() : new Date().getFullYear();

  const isActiveFilter =
    params.is_active === "true"
      ? true
      : params.is_active === "false"
        ? false
        : undefined;

  const [leaveTypesResponse, leaveDetailsResponse, holidaysResponse] = await Promise.all([
    getLeaveTypes({
      search: typeof params.search === "string" ? params.search : undefined,
      is_active: isActiveFilter,
    }),
    getLeaveDetails({
      year: params.year,
    }),
    getLeaveHolidays({
      year: typeof params.year === "string" ? params.year : new Date().getFullYear(),
    }),
  ]);

  return (
    <LeaveTypesBoard
      leaveTypes={leaveTypesResponse?.data ?? []}
      holidays={extractHolidayRows(holidaysResponse?.data)}
      detailsData={normalizeLeaveDetails(leaveDetailsResponse?.data, fallbackYear)}
      canEditLeaveTypes={["admin", "hr"].includes(role)}
      canImportMandatoryLeave={["admin", "hr"].includes(role)}
    />
  );
};

export default LeaveTypesServer;
