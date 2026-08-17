/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { baseApi } from "../baseApi";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import {
  clearSessionCookies,
  hasSessionTokens,
  writeSessionCookies,
} from "@/lib/sessionCookies";

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
    // A marketing-site signup that never created its organization signs in
    // successfully but with null tokens and a `/create-organization` redirect.
    // Persisting those would satisfy `middleware.ts` while every API call came
    // back 401 — which is how this case used to land on /session-expired.
    if (hasSessionTokens(res.data)) {
      await writeSessionCookies(
        {
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          timeZone: res.data.time_zone,
        },
        {
          id: res.data.id,
          email: res.data.email,
          role: res.data.role,
        },
      );
    } else {
      // Drop anything left over from an earlier session so the onboarding
      // dialog is the only way forward.
      await clearSessionCookies();
    }
  }

  return res;
};

/**
 * Reads the signed-in user's own profile.
 *
 * Profile images are stored as private-bucket keys and only become loadable
 * URLs when the API's signing middleware rewrites an `image` field — and the
 * signature expires after ~30 minutes. `/auth/update-profile-image` answers
 * with `imageUrl`, which that middleware does not rewrite, so the upload
 * response is never renderable on its own. Every consumer that needs a
 * displayable avatar re-reads it here instead.
 */
export const getMyProfile = async () => {
  const user = await getDecodedUser();

  if (!user?.id) {
    return { success: false, message: "No active session" };
  }

  return await baseApi(`/auth/employees/${user.id}`, {
    cache: "no-cache",
  });
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
    await writeSessionCookies({ accessToken: res.data.accessToken });
  }

  return res;
};

export async function clearSessionCookie() {
  await clearSessionCookies();
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
    await writeSessionCookies({
      accessToken: res.data.accessToken,
      refreshToken: res.data.refreshToken,
      timeZone: res.data.time_zone,
    });
  }

  return res;
};
