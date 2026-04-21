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

// Define a duration for cookies (e.g., 30 days)
const MAX_AGE = 60 * 60 * 24 * 30;

async function setSessionMetaCookies(
  data: {
    id?: number | string;
    email?: string | null;
    role?: string | null;
  },
) {
  const isProd = process.env.NODE_ENV === "production";
  const cookieStore = await cookies();

  if (data.id !== undefined && data.id !== null) {
    cookieStore.set("userId", String(data.id), {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });
  }

  if (data.email) {
    cookieStore.set("userEmail", data.email, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });
  }

  if (data.role) {
    cookieStore.set("userRole", data.role, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });
  }
}

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
      maxAge: MAX_AGE,
    });

    cookieStore.set("refreshToken", res.data.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });

    cookieStore.set("timeZone", res.data.time_zone, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });

    await setSessionMetaCookies({
      id: res.data.id,
      email: res.data.email,
      role: res.data.role,
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
    cache: "no-cache"
  });
};

export const uploadProfileInfo = async ({ data }: {
  data: {
    name: string;
    phone?: string;
    time_zone: string;
    currency?: string;
  }
}) => {
  return await baseApi(`/auth/update-profile`, {
    method: "PATCH",
    body: data,
    tag: "profile",
    cache: "no-cache"
  });
};

export const changePassword = async ({
  data,
}: {
  data: {
    oldPassword: string;
    newPassword: string;
  };
}) => {
  const res = await baseApi(`/auth/change-password`, {
    method: "PATCH",
    body: data,
    tag: "profile",
    cache: "no-cache",
  });

  if (res?.success) {
    const isProd = process.env.NODE_ENV === "production";
    const cookieStore = await cookies();

    cookieStore.set("accessToken", res.data.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });
  }

  return res;
};

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  cookieStore.delete("timeZone");
  cookieStore.delete("userId");
  cookieStore.delete("userEmail");
  cookieStore.delete("userRole");
}

export const forgetPassword = async ({ data }: {
  data: {
    email: string,
  }
}) => {
  return await baseApi(`/auth/forget-password`, {
    method: "POST",
    body: data,
    cache: "no-cache",
  });
};

export const verifyOtp = async ({ data }: {
  data: {
    email: string,
    code: string,
  }
}) => {
  return await baseApi(`/auth/verify-otp`, {
    method: "POST",
    body: data,
    cache: "no-cache",
  });
};

export const resetOtp = async ({ data }: {
  data: {
    email: string,
  }
}) => {
  return await baseApi(`/auth/resend-otp`, {
    method: "POST",
    body: data,
    cache: "no-cache",
  });
};

export const resetPassword = async ({ data }: {
  data: {
    reset_token: string,
    password: string,
  }
}) => {
  // return await baseApi(`/auth/reset-password`, {
  //   method: "POST",
  //   body: data,
  // });
  const res = await baseApi("/auth/reset-password", {
    method: "POST",
    body: data,
    cache: "no-cache",
  });

  if (res?.success) {
    const isProd = process.env.NODE_ENV === "production";
    const cookieStore = await cookies();

    cookieStore.set("accessToken", res.data.accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });

    cookieStore.set("refreshToken", res.data.refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });

    cookieStore.set("timeZone", res.data.time_zone, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });

    await setSessionMetaCookies({
      id: res.data.id,
      email: res.data.email,
      role: res.data.role,
    });
  }

  return res;
};
