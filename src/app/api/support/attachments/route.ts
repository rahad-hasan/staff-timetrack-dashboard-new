import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Browser → Next → API relay for support attachment uploads.
 *
 * The session token is an httpOnly cookie, so the browser cannot call the
 * API directly, and server actions are capped at 2 MB (next.config) — far
 * below the 10 MB an attachment may be. A route handler has no such cap and
 * lets the client use XHR for a real progress bar.
 *
 * Multipart field: `files` (one or more). The API's response envelope is
 * returned untouched so the client sees the same shape it gets everywhere.
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    return NextResponse.json(
      { success: false, message: "Your session has expired. Please sign in again." },
      { status: 401 },
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { success: false, message: "API base URL is not configured" },
      { status: 500 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid upload request" },
      { status: 400 },
    );
  }

  const files = formData
    .getAll("files")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return NextResponse.json(
      { success: false, message: "Attach at least one file" },
      { status: 400 },
    );
  }

  const upstreamBody = new FormData();
  for (const file of files) {
    upstreamBody.append("files", file, file.name);
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}/api/v1/tickets/attachments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: upstreamBody,
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Server is not active. Please try again later." },
      { status: 503 },
    );
  }

  const payload = await upstream.json().catch(() => null);

  if (payload && typeof payload === "object") {
    return NextResponse.json(payload, { status: upstream.status });
  }

  // A non-JSON body (a proxy's HTML 413/502 page) carries no usable message;
  // the client maps the status code to friendly wording itself.
  return NextResponse.json({ success: upstream.ok }, { status: upstream.status });
}
