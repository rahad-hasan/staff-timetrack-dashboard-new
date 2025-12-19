/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { baseApi } from "../baseApi";

export const logIn = async (data: any) => {
  return await baseApi("/auth/signin", {
    method: "POST",
    body: data,
  });
};
