"use server";

import { baseApi } from "../baseApi";
import type { QueryParams } from "@/utils/buildQuery";
import { EmploymentStatus, IMember, IResponse } from "@/types/type";

export const getMembers = async (query: QueryParams = {}): Promise<IResponse<IMember[]>> => {
  return await baseApi(`/auth/employees`, {
    query,
    tag: "members",
  });
};

export const getSingleDetailsMember = async (
  id: string,
): Promise<IResponse<IMember[]>> => {
  return await baseApi(`/auth/employees/${id}`, {
    tag: "members",
  });
};

/**
 * Active members for a picker, optionally narrowed to one project's assignees
 * (`project_id`). The API reads nothing else — it has no paging — so callers
 * pass no other parameter: each extra one only made another URL for the same
 * list.
 */
export const getMembersDashboard = async (
  query: QueryParams = {},
): Promise<IResponse<{ id: number; name: string; image: string }[]>> => {
  return await baseApi(`/dashboard/members`, { query });
};

export const addMember = async (data: {
  name: string;
  email: string;
  role: string;
  password: string;
}) => {
  return await baseApi(`/auth/employees`, {
    method: "POST",
    body: data,
    tag: "members",
  });
};

/**
 * The one write for an employee record — the members table's edit dialog and
 * the member detail page both send their changed fields here.
 */
export const editMember = async ({
  data,
  id,
}: {
  data: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    password?: string;
    status?: EmploymentStatus;
    time_zone?: string;
    gender?: "male" | "female" | "other";
    birth_day?: string | null;
    is_active?: boolean;
    is_tracking?: boolean;
    url_tracking?: boolean;
    multi_factor_auth?: boolean;
  };
  id: number | undefined;
}) => {
  return await baseApi(`/auth/employees/${id}`, {
    method: "PATCH",
    body: data,
    tag: "members",
  });
};

export const deleteMember = async (id: number | undefined) => {
  return await baseApi(`/auth/employees/${id}`, {
    method: "DELETE",
    tag: "members",
  });
};
