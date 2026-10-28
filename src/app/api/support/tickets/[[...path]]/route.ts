import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Browser → Next → API relay for the requester ticket endpoints
 * (`/api/support/tickets/*` → `${NEXT_PUBLIC_API_URL}/api/v1/tickets/*`).
 *
 * Same precedent as `../attachments/route.ts`: the session token is an
 * httpOnly cookie, so the browser cannot call the API itself. A route
 * handler (rather than a server action) keeps the request abortable, lets
 * calls run in parallel and forwards the `Idempotency-Key` header. Only the
 * §8.3 requester paths are relayed (allow-list below); anything else is 404
 * here, before it reaches the API.
 *
 * Request bodies are small JSON (≤ 256 KB, read once to re-check a chunked
 * length); responses are STREAMED back (`upstream.body`, no parse and
 * re-serialise on the Next server — a 50-message detail is tens of KB) with
 * `Idempotent-Replayed` / `Retry-After` forwarded. Only a non-JSON upstream
 * body (a proxy's HTML error page) is replaced by a JSON envelope.
 */

type Method = "GET" | "POST" | "DELETE";

const ALLOWED: ReadonlyArray<{ methods: readonly Method[]; pattern: RegExp }> = [
  { methods: ["GET", "POST"], pattern: /^$/ }, // list / create
  { methods: ["GET"], pattern: /^counts$/ },
  { methods: ["GET"], pattern: /^categories$/ },
  { methods: ["GET"], pattern: /^\d{1,10}$/ },
  {
    methods: ["POST"],
    pattern: /^\d{1,10}\/(messages|read|feedback|reopen-as-new)$/,
  },
  { methods: ["GET"], pattern: /^attachments\/url$/ },
  { methods: ["DELETE"], pattern: /^attachments\/\d{1,10}$/ },
];

const SEGMENT = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Largest JSON body relayed. The biggest legitimate one is a create (title
 * ≤ 200 + description ≤ 10 000 chars ≈ 40 KB at 4 bytes/char + ids); anything
 * larger is refused here instead of being buffered and forwarded.
 */
const MAX_BODY_BYTES = 256 * 1024;

/**
 * Defence in depth for the state-changing methods: the session cookie is
 * SameSite=Lax (lib/sessionCookies.ts), which already keeps it off
 * cross-site POST/DELETE; this also refuses a request the BROWSER labels as
 * coming from another site (`Sec-Fetch-Site`, sent by every current engine).
 * A missing header (old engine, server-side caller) is allowed — the header
 * is computed by the browser, so this never depends on proxy Host headers.
 */
const isCrossSite = (request: NextRequest) => {
  const site = request.headers.get("sec-fetch-site");
  return site === "cross-site" || site === "same-site";
};

const FORWARDED_REQUEST_HEADERS = ["content-type", "idempotency-key", "accept"] as const;
const FORWARDED_RESPONSE_HEADERS = ["idempotent-replayed", "retry-after"] as const;

const json = (status: number, body: Record<string, unknown>) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function relay(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
): Promise<NextResponse> {
  const method = request.method.toUpperCase() as Method;
  const { path = [] } = await context.params;

  if (!path.every((segment) => SEGMENT.test(segment))) {
    return json(404, { success: false, statusCode: 404, message: "Not found" });
  }
  const joined = path.join("/");
  const allowed = ALLOWED.some(
    (rule) => rule.methods.includes(method) && rule.pattern.test(joined),
  );
  if (!allowed) {
    return json(404, { success: false, statusCode: 404, message: "Not found" });
  }
  if (method !== "GET" && isCrossSite(request)) {
    return json(403, { success: false, statusCode: 403, message: "Forbidden" });
  }
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return json(413, { success: false, statusCode: 413, message: "Request is too large" });
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
    return json(500, {
      success: false,
      statusCode: 500,
      message: "API base URL is not configured",
    });
  }

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers[name] = value;
  }

  let body: string | undefined;
  if (method !== "GET") {
    body = await request.text();
    // a chunked body carries no content-length: re-check what was read
    if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
      return json(413, { success: false, statusCode: 413, message: "Request is too large" });
    }
    if (body.length === 0) body = undefined;
    if (body !== undefined && !headers["content-type"]) {
      headers["content-type"] = "application/json";
    }
  }

  const upstreamUrl = `${baseUrl}/api/v1/tickets${joined ? `/${joined}` : ""}${request.nextUrl.search}`;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method,
      headers,
      body,
      cache: "no-store",
      // A navigation away or a superseded search aborts the upstream call too.
      signal: request.signal,
    });
  } catch (error) {
    if (request.signal.aborted || (error instanceof Error && error.name === "AbortError")) {
      return json(499, { success: false, statusCode: 499, message: "Request cancelled" });
    }
    return json(503, {
      success: false,
      statusCode: 503,
      message: "Server is not active. Please try again later.",
    });
  }

  const responseHeaders: Record<string, string> = { "Cache-Control": "no-store" };
  for (const name of FORWARDED_RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders[name] = value;
  }

  const upstreamType = upstream.headers.get("content-type") ?? "";
  if (upstream.body && /^application\/(?:[\w.+-]+\+)?json\b/i.test(upstreamType)) {
    responseHeaders["content-type"] = upstreamType;
    return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
  }

  // A non-JSON body (a proxy's HTML 502/413 page) carries nothing the client can show.
  void upstream.body?.cancel().catch(() => undefined);
  return NextResponse.json(
    { success: false, statusCode: upstream.status, message: "Unexpected response from the server." },
    { status: upstream.ok ? 502 : upstream.status, headers: responseHeaders },
  );
}

export const GET = relay;
export const POST = relay;
export const DELETE = relay;
