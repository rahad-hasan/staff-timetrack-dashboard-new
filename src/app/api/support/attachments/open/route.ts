import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SUPPORT_ATTACHMENT_KEY_PREFIX } from "@/lib/supportAttachments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * `GET /api/support/attachments/open?key=…` → 302 to a freshly signed URL.
 *
 * The signed URLs embedded in a ticket page expire after a few minutes
 * (S3_READ_URL_TTL_SECONDS). Linking through this route means a click works
 * however long the page has been open; the API re-checks that the caller
 * may see the attachment before signing.
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key")?.trim() ?? "";

  if (!key.startsWith(SUPPORT_ATTACHMENT_KEY_PREFIX)) {
    return NextResponse.json(
      { success: false, message: "Invalid attachment key" },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/session-expired", request.url), 302);
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API base URL is not configured" },
      { status: 500 },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `${baseUrl}/api/v1/tickets/attachments/url?key=${encodeURIComponent(key)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Server is not active. Please try again later." },
      { status: 503 },
    );
  }

  if (upstream.status === 401) {
    return NextResponse.redirect(new URL("/session-expired", request.url), 302);
  }

  const payload = await upstream.json().catch(() => null);
  const url: unknown = payload?.data?.url;

  if (!upstream.ok || typeof url !== "string" || !/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      {
        success: false,
        message:
          (typeof payload?.message === "string" && payload.message) ||
          "Attachment not found",
      },
      { status: upstream.ok ? 502 : upstream.status },
    );
  }

  const response = NextResponse.redirect(url, 302);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
