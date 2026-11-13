"use server";

import { baseApi } from "../baseApi";
import type { QueryParams } from "@/utils/buildQuery";
import { AdminLeaveHistoryFilters, CreateLeaveHolidayPayload, CreateLeaveTypePayload, ILeaveDetailsResponse, ILeaveRequest, IResponse, LeaveCalendarData, LeaveCalendarFilters, LeaveHoliday, LeaveHolidayListData, LeaveRecord, LeaveRequestTypeDropdownRecord, LeaveTypeListFilters, LeaveTypeRecord, MandatoryLeaveImportPayload, MandatoryLeaveParsePayload, MandatoryLeaveParseResult, UpdateLeaveHolidayPayload, UpdateLeaveRequestPayload, UpdateLeaveTypePayload, UserLeaveSummary } from "@/types/type";

/**
 * The tags every leave write revalidates — one list for every write, so no
 * write can forget a view.
 *
 * The writes are entangled: a request moves balances and the leave-type usage
 * counts, and a holiday changes the calendar and every employee's summary.
 * baseApi revalidates these after a successful write, which is also what makes
 * the action answer with a fresh render of the page it was called from (reads
 * are live, so that render is current). There used to be a second, hand-kept
 * list of revalidateTag/revalidatePath calls on top of it — two lists that had
 * already drifted apart.
 */
const LEAVE_TAGS = ["leaves", "leave-types", "leave-holidays"] as const;

export const getLeaveCalendar = async (query: LeaveCalendarFilters = {}): Promise<IResponse<LeaveCalendarData>> => {
  return await baseApi(`/leaves/calendar`, {
    query,
    tag: "leaves",
  });
};

export const getLeaveHistory = async (query: AdminLeaveHistoryFilters = {}): Promise<IResponse<LeaveRecord[]>> => {
  return await baseApi(`/leaves/history`, {
    query,
    tag: "leaves",
  });
};

export const getLeave = async (query: QueryParams = {}): Promise<IResponse<ILeaveRequest[]>> => {
  return await baseApi(`/leaves`, {
    query,
    tag: "leaves",
  });
};

export const approveRejectLeave = async ({
  data,
}: {
  data: {
    leave_id: number;
    approved: boolean;
    reject_reason?: string;
  };
}): Promise<IResponse<LeaveRecord>> => {
  return await baseApi(`/leaves/update-status`, {
    method: "PATCH",
    body: data,
    tag: LEAVE_TAGS,
  });
};

export const getLeaveDetails = async (
  query: QueryParams = {},
): Promise<IResponse<ILeaveDetailsResponse>> => {
  return await baseApi(`/leaves/details`, {
    query,
    tag: "leaves",
  });
};

export const getLeaveTypes = async (
  query: LeaveTypeListFilters = {},
): Promise<IResponse<LeaveTypeRecord[]>> => {
  return await baseApi(`/leaves/types`, {
    query,
    tag: "leave-types",
  });
};

export const createLeaveType = async (
  data: CreateLeaveTypePayload,
): Promise<IResponse<LeaveTypeRecord>> => {
  return await baseApi(`/leaves/types`, {
    method: "POST",
    body: data,
    tag: LEAVE_TAGS,
  });
};

export const updateLeaveType = async (
  id: number,
  data: UpdateLeaveTypePayload,
): Promise<IResponse<LeaveTypeRecord>> => {
  return await baseApi(`/leaves/types/${id}`, {
    method: "PATCH",
    body: data,
    tag: LEAVE_TAGS,
  });
};

export const deleteLeaveType = async (id: number): Promise<IResponse<null>> => {
  return await baseApi(`/leaves/types/${id}`, {
    method: "DELETE",
    tag: LEAVE_TAGS,
  });
};

export const getLeaveType = async (
  id: number,
): Promise<IResponse<LeaveTypeRecord>> => {
  return await baseApi(`/leaves/types/${id}`, {
    tag: "leave-types",
  });
};

// holidays
export const createLeaveHoliday = async (
  data: CreateLeaveHolidayPayload,
): Promise<IResponse<LeaveHoliday>> => {
  return await baseApi(`/leaves/holidays`, {
    method: "POST",
    body: data,
    tag: LEAVE_TAGS,
  });
};

export const updateLeaveHoliday = async (
  id: number,
  data: UpdateLeaveHolidayPayload,
): Promise<IResponse<LeaveHoliday>> => {
  return await baseApi(`/leaves/holidays/${id}`, {
    method: "PATCH",
    body: data,
    tag: LEAVE_TAGS,
  });
};

export const deleteLeaveHoliday = async (id: number): Promise<IResponse<null>> => {
  return await baseApi(`/leaves/holidays/${id}`, {
    method: "DELETE",
    tag: LEAVE_TAGS,
  });
};

export const getLeaveHolidays = async (
  query: { year?: string | number, page?: string | number, limit?: string | number } = {},
): Promise<IResponse<LeaveHolidayListData>> => {
  return await baseApi(`/leaves/holidays`, {
    query,
    tag: "leave-holidays",
  });
};

export const deleteLeave = async (id: number): Promise<IResponse<null>> => {
  return await baseApi(`/leaves/${id}`, {
    method: "DELETE",
    tag: LEAVE_TAGS,
  });
};

export const updateLeaveRequest = async (
  id: number,
  data: UpdateLeaveRequestPayload,
): Promise<IResponse<LeaveRecord>> => {
  return await baseApi(`/leaves/${id}`, {
    method: "PATCH",
    body: data,
    tag: LEAVE_TAGS,
  });
};

export const addLeave = async (data: {
  leave_type_id: number;
  start_date: string;
  end_date: string;
  reason: string;
  document: File | null | undefined;
}): Promise<IResponse<LeaveRecord>> => {
  const formData = new FormData();
  formData.append("leave_type_id", data.leave_type_id.toString());
  formData.append("start_date", data.start_date);
  formData.append("end_date", data.end_date);
  formData.append("reason", data.reason);

  // Append the document file if it's provided
  if (data.document) {
    formData.append("document", data.document);
  }

  return await baseApi(`/leaves`, {
    method: "POST",
    body: formData,
    tag: LEAVE_TAGS,
    isFormData: true,
  });
};


export const getLeaveRequestTypeDropdown = async (): Promise<
  IResponse<LeaveRequestTypeDropdownRecord[]>
> => {
  return await baseApi(`/leaves/dropdown/types`, {
    tag: "leaves",
  });
};

export const getUserLeaveSummary = async (
  query: QueryParams = {},
): Promise<IResponse<UserLeaveSummary>> => {
  return await baseApi(`/leaves/details/user`, {
    query,
    tag: "leaves",
  });
};

export const insertParsedHolidays = async (
  data: MandatoryLeaveImportPayload,
): Promise<
  IResponse<{
    total_submitted: number;
    imported_count: number;
    skipped_count: number;
  }>
> => {
  return await baseApi(`/leaves/holidays/import`, {
    method: "POST",
    body: data,
    tag: LEAVE_TAGS,
  });
};

// A POST that only reads (it previews the parsed file), so it carries no tag:
// nothing changed, so nothing is revalidated and the page is not re-rendered.
export const parseLeaveHolidayImport = async (
  data: MandatoryLeaveParsePayload,
): Promise<IResponse<MandatoryLeaveParseResult>> => {
  return await baseApi(`/leaves/holidays/import/parse`, {
    method: "POST",
    body: data,
  });
};
