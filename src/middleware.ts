import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * `pathname` on the origin the browser actually used.
 *
 * Not `new URL(pathname, request.url)`: production runs `next start -H
 * 127.0.0.1` behind Cloudflare, so Next builds `request.url` from that bind
 * address and rewrites it to "localhost". A redirect built from it sent real
 * users to http://localhost:3000/auth/login.
 *
 * Reads `Host`, which Cloudflare sets to the public hostname, and never
 * `X-Forwarded-Host`: that reaches the server exactly as the client sent it.
 */
function publicUrl(request: NextRequest, pathname: string): URL {
  const host = request.headers.get("host");
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol =
    forwardedProto === "https" || forwardedProto === "http"
      ? forwardedProto
      : request.nextUrl.protocol.replace(":", "");

  if (host) {
    try {
      return new URL(pathname, `${protocol}://${host}`);
    } catch {
      // A malformed Host header falls through to Next's own URL.
    }
  }
  return new URL(pathname, request.url);
}

/**
 * Three base64url segments: the only shape the API's tokens come in. Anything
 * else in the cookie (Express writes a null token as "j:null") can never
 * authenticate, and letting it through rendered the protected layout only for
 * every read on it to 401 and bounce the user to /session-expired.
 */
const JWT_SHAPE = /^[\w-]+\.[\w-]+\.[\w-]+$/;

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;

  if (!token || !JWT_SHAPE.test(token)) {
    const response = NextResponse.redirect(publicUrl(request, "/auth/login"));
    // Drop a value that can never work rather than carry it on every request.
    if (token) response.cookies.delete("accessToken");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  // Every authenticated top-level segment: each `(main_layout)` child plus the
  // standalone /billing and /onboarding pages. A new segment that is not
  // listed here renders for signed-out visitors. Public by omission: /auth/**
  // (OTP and the conversion landing pages included), /session-expired,
  // /api/**, Next internals and static files.
  matcher: [
    "/dashboard/:path*",
    "/timesheets/:path*",
    "/activity/:path*",
    "/event/:path*",
    "/schedule/:path*",
    "/insights/:path*",
    "/members/:path*",
    "/project-management/:path*",
    "/leave-management/:path*",
    "/notification/:path*",
    "/report/:path*",
    "/settings/:path*",
    "/billing/:path*",
    "/onboarding/:path*",
    "/download/:path*",
    "/payroll/:path*",
    "/support/:path*",
  ],
};