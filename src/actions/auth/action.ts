/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { baseApi } from "../baseApi";
import { getDecodedUser } from "@/utils/decodedLogInUser";
import { verifiedTrialConversionId } from "@/lib/verifiedTrialResponse";
import {
  rotateSessionTokens,
  startSession,
  writeSessionCookies,
  writeSignupProof,
} from "@/lib/sessionCookies";
import { withoutSessionTokens } from "@/lib/authSession";

export const logIn = async (data: any) => {
  const res = await baseApi("/auth/signin", {
    method: "POST",
    body: data,
  });

  if (res?.success) {
    // A marketing-site signup that never created its organization signs in
    // successfully but with null tokens and a `/create-organization` redirect.
    // Persisting those would satisfy `middleware.ts` while every API call came
    // back 401 — which is how this case used to land on /session-expired.
    // `startSession` writes nothing for it and drops whatever an earlier
    // session left behind, so the onboarding page is the only way forward.
    const hasSession = await startSession(res.data);

    // The onboarding answer carries the proof `POST /company` asks for: the
    // password just matched the pending sign-up. Written AFTER `startSession`,
    // which clears the session cookies for this answer.
    if (!hasSession) await writeSignupProof(res.data?.signup_token);

    // The tokens are for the httpOnly cookies only. The client is told which
    // of the two answers this was instead of reading it off them.
    return { ...res, data: { ...withoutSessionTokens(res.data), hasSession } };
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

  return await baseApi(`/auth/employees/${user.id}`);
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

export const uploadProfileInfo = async ({ data }: {
  data: {
    name: string;
    phone?: string;
    time_zone: string;
  }
}) => {
  const res = await baseApi(`/auth/update-profile`, {
    method: "PATCH",
    body: data,
    tag: "profile",
  });

  if (res?.success) {
    // The `timeZone` cookie is the server's fallback zone (`getViewerTimeZone`,
    // the screenshot buckets). Written only at sign-in, it kept the old zone
    // for up to 30 days after the user changed theirs here.
    await writeSessionCookies({
      timeZone: res.data?.time_zone ?? data.time_zone,
    });
  }

  return res;
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
  });

  if (res?.success) {
    // Both tokens: the change ends every session issued before it, and the
    // refresh token this browser held is one of them. (An API that predates
    // the rotated refresh token answers with the access token alone, which
    // is then all that is written.)
    await rotateSessionTokens({
      accessToken: res.data?.accessToken,
      refreshToken: res.data?.refreshToken,
    });

    // The rotated tokens go to the cookies, not to the page.
    return { ...res, data: withoutSessionTokens(res.data) };
  }

  return res;
};

export const forgetPassword = async ({ data }: {
  data: {
    email: string,
  }
}) => {
  return await baseApi(`/auth/forget-password`, {
    method: "POST",
    body: data,
  });
};

export const verifyOtp = async ({ data }: {
  data: {
    email: string,
    code: string,
  }
}) => {
  const res = await baseApi(`/auth/verify-otp`, {
    method: "POST",
    body: data,
  });
  const conversionId = verifiedTrialConversionId(res);

  if (!res?.success) return res;

  // A sign-up verification answers with a sign-up token (`signup_token`, and
  // under `accessToken` as before; the conversion id above is derived from
  // the latter). It is the proof `POST /company` asks for, so it is kept, in
  // an httpOnly cookie: nothing in the browser needs to read it. An API that
  // predates it sends none and requires none. The `reset_token` of a
  // forgot-password verification stays in the answer: the next screen sends
  // it back.
  await writeSignupProof(res.data?.signup_token);

  const safe = withoutSessionTokens(res.data);
  return {
    ...res,
    data: conversionId ? { ...safe, signup_conversion_id: conversionId } : safe,
  };
};

/**
 * `POST /auth/resend-otp` validates `reason` against the backend's OtpReason
 * enum and rejects the request without it — every caller must say which flow
 * the code belongs to (`sign_up` for onboarding, `forgot_password` for the
 * reset flow).
 */
export const resetOtp = async ({ data }: {
  data: {
    email: string,
    reason: "sign_up" | "forgot_password" | "two_factor_auth" | "change_email" | "change_phone",
  }
}) => {
  return await baseApi(`/auth/resend-otp`, {
    method: "POST",
    body: data,
  });
};

export const resetPassword = async ({ data }: {
  data: {
    reset_token: string,
    password: string,
  }
}) => {
  const res = await baseApi("/auth/reset-password", {
    method: "POST",
    body: data,
  });

  if (res?.success) {
    // Signs the user straight in, exactly like `logIn`: the identity cookies
    // go with the tokens. Without them every server-side role gate read an
    // undefined role (or a previous session's) until the next sign-in.
    const hasSession = await startSession(res.data);

    return { ...res, data: { ...withoutSessionTokens(res.data), hasSession } };
  }

  return res;
};
