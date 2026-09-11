import { createHash } from "node:crypto";

/** Server-only: call exclusively with the response of POST /auth/verify-otp.
 * This is not token authentication. The backend has already verified the OTP.
 * Never call with a token or success flag supplied directly by the browser.
 */
export function verifiedTrialConversionId(response: unknown): string | null {
  if (!response || typeof response !== "object") return null;
  const result = response as Record<string, unknown>;
  const data = result.data as Record<string, unknown> | undefined;
  if (
    result.success !== true ||
    !data ||
    data.redirect !== "/create-organization" ||
    data.reset_token ||
    typeof data.accessToken !== "string"
  ) return null;

  try {
    const parts = data.accessToken.split(".");
    if (parts.length !== 3 || !parts.every(Boolean)) return null;
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    // PendingUser uses a numeric database ID, not the user's email address.
    const id = claims.id;
    if (!Number.isSafeInteger(id) || id <= 0) return null;
    return "stt_otp_" + createHash("sha256")
      .update(`stafftimetracker.org:verified-trial:v1:${id}`)
      .digest("hex");
  } catch {
    // Analytics must never turn successful verification into a failed signup.
    return null;
  }
}
