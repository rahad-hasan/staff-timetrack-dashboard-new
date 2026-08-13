"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { EmploymentStatus, IMember, IResponse } from "@/types/type";
import { revalidatePath } from "next/cache";
import { API_TAGS } from "@/constants/api.constants";

export const getMembers = async (query = {}): Promise<IResponse<IMember[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/auth/employees${queryString ? `?${queryString}` : ""}`,
    {
      tag: API_TAGS.MEMBERS,
    },
  );
};

export const getSingleDetailsMember = async (
  id: string,
): Promise<IResponse<IMember[]>> => {
  return await baseApi(`/auth/employees/${id}`, {
    tag: API_TAGS.MEMBERS,
  });
};

export const editSingleDetailsMember = async ({
  data,
  id,
}: {
  data: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    status?: EmploymentStatus;
    time_zone?: string;
    pay_rate_hourly?: number;
    gender?: "male" | "female" | "other";
    currency?: string;
    birth_day?: string | null;
    is_active?: boolean;
    is_tracking?: boolean;
    url_tracking?: boolean;
    cam_tracking?: boolean;
    multi_factor_auth?: boolean;
  };
  id: number | undefined;
}) => {
  revalidatePath(`/members/${id}`);

  return await baseApi(`/auth/employees/${id}`, {
    method: "PATCH",
    body: data,
    tag: API_TAGS.MEMBERS,
    cache: "no-cache",
  });
};

export const getMembersDashboard = async (query = {}): Promise<
  IResponse<{ id: number; name: string; image: string }[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(`/dashboard/members${queryString ? `?${queryString}` : ""}`);
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
    tag: API_TAGS.MEMBERS,
    cache: "no-cache",
  });
};

export const editMember = async ({
  data,
  id,
}: {
  data: {
    name: string;
    // email: string;
    role: string;
    password?: string;
  };
  id: number | undefined;
}) => {
  return await baseApi(`/auth/employees/${id}`, {
    method: "PATCH",
    body: data,
    tag: API_TAGS.MEMBERS,
    cache: "no-cache",
  });
};

export const deleteMember = async (id: number | undefined) => {
  return await baseApi(`/auth/employees/${id}`, {
    method: "DELETE",
    tag: API_TAGS.MEMBERS,
    cache: "no-cache",
  });
};
