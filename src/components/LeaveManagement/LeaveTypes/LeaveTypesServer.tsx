import { getLeaveDetails, getLeaveTypes } from "@/actions/leaves/action";
import { canManageLeave } from "@/lib/leave";
import { ILeaveDetailsResponse, ISearchParamsProps } from "@/types/type";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import LeaveTypesBoard from "./LeaveTypesBoard";

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
  const fallbackYear =
    typeof params.year === "string" ? Number(params.year) || new Date().getFullYear() : new Date().getFullYear();

  const isActiveFilter =
    params.is_active === "true"
      ? true
      : params.is_active === "false"
        ? false
        : undefined;

  const [leaveTypesResponse, leaveDetailsResponse] = await Promise.all([
    getLeaveTypes({
      is_active: isActiveFilter,
    }),
    getLeaveDetails({
      year: typeof params.year === "string" ? params.year : undefined,
    }),
  ]);

  return (
    <LeaveTypesBoard
      leaveTypes={leaveTypesResponse?.data ?? []}
      detailsData={normalizeLeaveDetails(leaveDetailsResponse?.data, fallbackYear)}
      canEditLeaveTypes={canManageLeave(currentUser?.role)}
    />
  );
};

export default LeaveTypesServer;
