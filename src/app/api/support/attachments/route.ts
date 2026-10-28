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
 * Multipart field: `files`. The v2 upload queue (`uploadSupportAttachment`,
 * lib/supportAttachments.ts) sends ONE file per request, so a request is at
 * most one 10 MB file plus the multipart framing.
 *
 * Bounded and streamed (step-9a review — the relay used to `formData()` any
 * body into memory, a 40 MB body with a fake cookie was buffered whole and
 * forwarded):
 *   - `Content-Length` is required (XHR always sends it) and must be at most
 *     `MAX_UPLOAD_BYTES`; anything else is refused before a byte is read.
 *   - The body is piped to the API as it arrives (`duplex: "half"`) through a
 *     counter that errors the stream past the cap, so a lying length cannot
 *     push more through and the process never holds the file.
 *   - `signal: request.signal`: removing an upload in the UI (XHR abort)
 *     cancels the API request too.
 *   - Cross-site / same-site POSTs are refused (same rule as the tickets relay).
 * The API's JSON envelope is streamed back untouched with its status.
 */

/** 10 MB attachment (SUPPORT_ATTACHMENT_MAX_BYTES) + 512 KB for the multipart boundary and part headers. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 + 512 * 1024;

const FORWARDED_RESPONSE_HEADERS = ["retry-after"] as const;

const json = (status: number, body: Record<string, unknown>) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

const isCrossSite = (request: NextRequest) => {
  const site = request.headers.get("sec-fetch-site");
  return site === "cross-site" || site === "same-site";
};

/** Passes the bytes through and errors the stream once more than `limit` went by. */
const byteLimit = (limit: number, onOver: () => void) => {
  let seen = 0;
  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      seen += chunk.byteLength;
      if (seen > limit) {
        onOver();
        controller.error(new Error("upload body over the relay limit"));
        return;
      }
      controller.enqueue(chunk);
    },
  });
};

export async function POST(request: NextRequest) {
  if (isCrossSite(request)) {
    return json(403, { success: false, statusCode: 403, message: "Forbidden" });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data;\s*boundary=/i.test(contentType)) {
    return json(400, { success: false, statusCode: 400, message: "Invalid upload request" });
  }

  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader === null || !/^\d{1,12}$/.test(lengthHeader.trim())) {
    return json(411, { success: false, statusCode: 411, message: "Upload size is missing." });
  }
  const declared = Number(lengthHeader);
  if (declared > MAX_UPLOAD_BYTES) {
    return json(413, { success: false, statusCode: 413, message: "Files must be 10 MB or smaller" });
  }
  if (declared === 0 || !request.body) {
    return json(400, { success: false, statusCode: 400, message: "Attach at least one file" });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) {
    return json(401, {
      success: false,
      statusCode: 401,
      message: "Your session has expired. Please sign in again.",
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    return json(500, { success: false, statusCode: 500, message: "API base URL is not configured" });
  }

  let overLimit = false;
  let upstream: Response;
  try {
    upstream = await fetch(`${baseUrl}/api/v1/tickets/attachments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": contentType,
        "content-length": String(declared),
      },
      body: request.body.pipeThrough(
        byteLimit(Math.min(declared, MAX_UPLOAD_BYTES), () => {
          overLimit = true;
        }),
      ),
      // a streamed request body (undici): sent while it is read
      duplex: "half",
      cache: "no-store",
      signal: request.signal,
    } as RequestInit & { duplex: "half" });
  } catch (error) {
    if (overLimit) {
      return json(413, { success: false, statusCode: 413, message: "Files must be 10 MB or smaller" });
    }
    if (request.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
      return json(499, { success: false, statusCode: 499, message: "Upload cancelled" });
    }
    return json(503, { success: false, statusCode: 503, message: "Server is not active. Please try again later." });
  }

  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers[name] = value;
  }

  const upstreamType = upstream.headers.get("content-type") ?? "";
  if (upstream.body && /^application\/(?:[\w.+-]+\+)?json\b/i.test(upstreamType)) {
    headers["content-type"] = upstreamType;
    return new NextResponse(upstream.body, { status: upstream.status, headers });
  }

  // A non-JSON body (a proxy's HTML 413/502 page) carries no usable message;
  // the client maps the status code to friendly wording itself.
  void upstream.body?.cancel().catch(() => undefined);
  return NextResponse.json({ success: upstream.ok, statusCode: upstream.status }, { status: upstream.status, headers });
}
