"use server";

import { buildQuery } from "@/utils/buildQuery";
import { baseApi } from "../baseApi";
import { IMember, IResponse } from "@/types/type";

export const getMembers = async (query = {}): Promise<IResponse<IMember[]>> => {
  const queryString = buildQuery(query);
  return await baseApi(
    `/auth/employees${queryString ? `?${queryString}` : ""}`,
    {
      tag: "members",
    },
  );
};

export const getSingleDetailsMember = async (
  id: string,
): Promise<IResponse<IMember[]>> => {
  return await baseApi(`/auth/employees/${id}`, {
    tag: "members",
  });
};

export const editSingleDetailsMember = async ({
  data,
  id,
}: {
  data: {
    name: string;
    email: string;
    phone: string;
    role: string;
    pay_rate_hourly: number;
    is_active: boolean;
    is_tracking: boolean;
    url_tracking: boolean;
    cam_tracking: boolean;
    multi_factor_auth: boolean;
  };
  id: number | undefined;
}) => {
  return await baseApi(`/auth/employees/${id}`, {
    method: "PATCH",
    body: data,
    tag: "members",
  });
};

export const getMembersDashboard = async (): Promise<
  IResponse<{ id: number; name: string; image: string }[]>
> => {
  const response = await baseApi(`/dashboard/members`);
  return response;
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

export const editMember = async ({
  data,
  id,
}: {
  data: {
    name: string;
    // email: string,
    role: string;
    password: string;
  };
  id: number | undefined;
}) => {
  return await baseApi(`/auth/employees/${id}`, {
    method: "PATCH",
    body: data,
    tag: "members",
  });
};

export const deleteMember = async ({
  data,
  id,
}: {
  data: {
    is_deleted: boolean;
  };
  id: number | undefined;
}) => {
  return await baseApi(`/auth/employees/${id}`, {
    method: "PATCH",
    body: data,
    tag: "members",
  });
};
