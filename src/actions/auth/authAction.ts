/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { baseApi } from "../baseApi";
import { cookies } from "next/headers";

// export const logIn = async (data: any) => {
//   return await baseApi("/auth/signin", {
//     method: "POST",
//     body: data,
//   });
// };

export const logIn = async (data: any) => {
  const res = await baseApi("/auth/signin", {
    method: "POST",
    body: data,
  });

  if (res?.success) {
    const isProd = process.env.NODE_ENV === "production";
    const cookieStore = await cookies();

    cookieStore.set("accessToken", res.data.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
    });

    cookieStore.set("refreshToken", res.data.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
    });
  }

  return res;
};