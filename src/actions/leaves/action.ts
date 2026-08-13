"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { AdminLeaveHistoryFilters, CreateLeaveHolidayPayload, CreateLeaveTypePayload, ILeaveDetailsResponse, ILeaveRequest, IResponse, LeaveCalendarData, LeaveCalendarFilters, LeaveHoliday, LeaveHolidayListData, LeaveRecord, LeaveRequestTypeDropdownRecord, LeaveTypeListFilters, LeaveTypeRecord, MandatoryLeaveImportPayload, MandatoryLeaveParsePayload, MandatoryLeaveParseResult, UpdateLeaveHolidayPayload, UpdateLeaveTypePayload, UserLeaveSummary } from "@/types/type";
import { revalidatePath, revalidateTag } from "next/cache";
import { API_TAGS } from "@/constants/api.constants";

// export const getLeave = async (query = {}): Promise<IResponse<ILeaveRequest[]>> => {
//     const queryString = buildQuery(query);
//     return await baseApi(`/leaves${queryString ? `?${queryString}` : ""}`, {
//         tag: API_TAGS.LEAVES,
//     });
// };

// export const getLeaveDetails = async (query = {}): Promise<IResponse<ILeaveDetailsResponse>> => {
//     const queryString = buildQuery(query);
//     return await baseApi(`/leaves/details${queryString ? `?${queryString}` : ""}`, {
//         tag: API_TAGS.LEAVES,
//     });
// };

// export const addLeave = async (data: {
//     type: string;
//     start_date: string;
//     end_date: string;
//     reason: string;
// }) => {
//     return await baseApi(`/leaves`, {
//         method: "POST",
//         body: data,
//         tag: API_TAGS.LEAVES,
//         cache: "no-cache",
//     });
// };

// export const approveRejectLeave = async ({ data }: {
//     data: {
//         leave_id: number,
//         approved: boolean,
//         reject_reason?: string
//     }
// }) => {
//     return await baseApi(`/leaves/update-status`, {
//         method: "PATCH",
//         body: data,
//         tag: API_TAGS.LEAVES,
//         cache: "no-cache",
//     });
// };

// export const deleteLeave = async ({ data, id }: {
//     data: {
//         is_deleted: boolean,
//     },
//     id: number | undefined
// }) => {
//     return await baseApi(`/leaves/${id}`, {
//         method: "PATCH",
//         body: data,
//         tag: API_TAGS.LEAVES,
//     });
// };


// ======== new api ==========
// ===========================

const revalidateHolidayViews = () => {
  revalidateTag(API_TAGS.leaveHOLIDAYS);
  revalidateTag(API_TAGS.LEAVES);
  revalidatePath("/leave-management/holidays");
  revalidatePath("/leave-management/calendar");
  revalidatePath("/leave-management/my-leaves");
};

export const getLeaveCalendar = async (query: LeaveCalendarFilters = {}): Promise<IResponse<LeaveCalendarData>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/leaves/calendar${queryString ? `?${queryString}` : ""}`, {
        tag: API_TAGS.LEAVES,
        cache: "no-cache"
    });
};

export const getLeaveHistory = async (query: AdminLeaveHistoryFilters = {}): Promise<IResponse<LeaveRecord[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/leaves/history${queryString ? `?${queryString}` : ""}`, {
        tag: API_TAGS.LEAVES,
        cache: "no-cache"
    });
};

export const getLeave = async (query={}): Promise<IResponse<ILeaveRequest[]>> => {
    const queryString = buildQuery(query);
    return await baseApi(`/leaves${queryString ? `?${queryString}` : ""}`, {
        tag: API_TAGS.LEAVES,
        cache: "no-cache"
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
  const response = await baseApi(`/leaves/update-status`, {
    method: "PATCH",
    body: data,
    tag: API_TAGS.LEAVES,
    cache: "no-cache",
  });

  if (response?.success) {
    revalidateTag(API_TAGS.LEAVES);
    revalidateTag(API_TAGS.leaveTYPES);
  }

  return response;
};

export const getLeaveDetails = async (
  query = {},
): Promise<IResponse<ILeaveDetailsResponse>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/leaves/details${queryString ? `?${queryString}` : ""}`,
    {
      tag: API_TAGS.LEAVES,
    },
  );
};

export const getLeaveTypes = async (
  query: LeaveTypeListFilters = {},
): Promise<IResponse<LeaveTypeRecord[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(`/leaves/types${queryString ? `?${queryString}` : ""}`, {
    tag: API_TAGS.leaveTYPES,
  });
};

export const createLeaveType = async (
  data: CreateLeaveTypePayload,
): Promise<IResponse<LeaveTypeRecord>> => {
  const response = await baseApi(`/leaves/types`, {
    method: "POST",
    body: data,
    tag: API_TAGS.leaveTYPES,
    cache: "no-cache",
  });

  if (response?.success) {
    revalidateTag(API_TAGS.leaveTYPES);
    revalidateTag(API_TAGS.LEAVES);
  }

  return response;
};

export const updateLeaveType = async (
  id: number,
  data: UpdateLeaveTypePayload,
): Promise<IResponse<LeaveTypeRecord>> => {
  const response = await baseApi(`/leaves/types/${id}`, {
    method: "PATCH",
    body: data,
    tag: API_TAGS.leaveTYPES,
    cache: "no-cache",
  });

  if (response?.success) {
    revalidateTag(API_TAGS.leaveTYPES);
    revalidateTag(API_TAGS.LEAVES);
  }

  return response;
};

export const deleteLeaveType = async (id: number): Promise<IResponse<null>> => {
  const response = await baseApi(`/leaves/types/${id}`, {
    method: "DELETE",
    tag: API_TAGS.leaveTYPES,
    cache: "no-cache",
  });

  if (response?.success) {
    revalidateTag(API_TAGS.leaveTYPES);
    revalidateTag(API_TAGS.LEAVES);
  }

  return response;
};

export const getLeaveType = async (
  id: number,
): Promise<IResponse<LeaveTypeRecord>> => {
  return await baseApi(`/leaves/types/${id}`, {
    tag: API_TAGS.leaveTYPES,
  });
};

// holidays
export const createLeaveHoliday = async (
  data: CreateLeaveHolidayPayload,
): Promise<IResponse<LeaveHoliday>> => {
  const response = await baseApi(`/leaves/holidays`, {
    method: "POST",
    body: data,
    tag: API_TAGS.leaveHOLIDAYS,
    cache: "no-cache",
  });

  if (response?.success) {
    revalidateHolidayViews();
  }

  return response;
};

export const updateLeaveHoliday = async (
  id: number,
  data: UpdateLeaveHolidayPayload,
): Promise<IResponse<LeaveHoliday>> => {
  const response = await baseApi(`/leaves/holidays/${id}`, {
    method: "PATCH",
    body: data,
    tag: API_TAGS.leaveHOLIDAYS,
    cache: "no-cache",
  });

  if (response?.success) {
    revalidateHolidayViews();
  }

  return response;
};

export const deleteLeaveHoliday = async (id: number): Promise<IResponse<null>> => {
  const response = await baseApi(`/leaves/holidays/${id}`, {
    method: "DELETE",
    tag: API_TAGS.leaveHOLIDAYS,
    cache: "no-cache",
  });

  if (response?.success) {
    revalidateHolidayViews();
  }

  return response;
};

export const getLeaveHolidays = async (
  query: { year?: string | number, page?: string | number, limit?: string | number } = {},
): Promise<IResponse<LeaveHolidayListData>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/leaves/holidays${queryString ? `?${queryString}` : ""}`,
    {
      tag: API_TAGS.leaveHOLIDAYS,
    },
  );
};

export const deleteLeave = async (id: number): Promise<IResponse<null>> => {
  const response = await baseApi(`/leaves/${id}`, {
    method: "DELETE",
    tag: API_TAGS.LEAVES,
    cache: "no-cache",
  });

  if (response?.success) {
    revalidateTag(API_TAGS.LEAVES);
    revalidateTag(API_TAGS.leaveTYPES);
  }

  return response;
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

  const response = await baseApi(`/leaves`, {
    method: "POST",
    body: formData,
    tag: API_TAGS.LEAVES,
    cache: "no-cache",
    isFormData: true,
  });

  if (response?.success) {
    revalidateTag(API_TAGS.LEAVES);
    revalidateTag(API_TAGS.leaveTYPES);
  }

  return response;
};


export const getLeaveRequestTypeDropdown = async (): Promise<
  IResponse<LeaveRequestTypeDropdownRecord[]>
> => {
  return await baseApi(`/leaves/dropdown/types`, {
    tag: API_TAGS.LEAVES,
    cache: "no-cache",
    revalidate: 0,
  });
};

export const getUserLeaveSummary = async (
  query = {},
): Promise<IResponse<UserLeaveSummary>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/leaves/details/user${queryString ? `?${queryString}` : ""}`,
    {
      tag: API_TAGS.LEAVES,
    },
  );
};

export const insertParsedHolidays = async (
  data: MandatoryLeaveImportPayload,
) => {
  const response = (await baseApi(`/leaves/holidays/import`, {
    method: "POST",
    body: data,
    cache: "no-cache",
  })) as IResponse<{
    total_submitted: number;
    imported_count: number;
    skipped_count: number;
  }>;

  if (response.success) {
    revalidateHolidayViews();
  }

  return response;
};

export const parseLeaveHolidayImport = async (
  data: MandatoryLeaveParsePayload,
): Promise<IResponse<MandatoryLeaveParseResult>> => {
  return await baseApi(`/leaves/holidays/import/parse`, {
    method: "POST",
    body: data,
    cache: "no-cache",
  });
};
