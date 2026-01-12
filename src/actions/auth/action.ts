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
    cache: "no-cache", // login should not be cached
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

export const uploadProfileImage = async ({ data }: {
  data: {
    image: string
  }
}) => {
  return await baseApi(`/auth/update-profile-image`, {
    method: "PATCH",
    body: data,
    tag: "profile",
  });
};

export const changePassword = async ({ data }: {
  data: {
    oldPassword: string,
    newPassword: string,
  }
}) => {
  return await baseApi(`/auth/change-password`, {
    method: "PATCH",
    body: data,
    tag: "profile",
  });
};


export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
}