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

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken");

  if (!token) {
    return NextResponse.redirect(publicUrl(request, "/auth/login"));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/timesheets/:path*",
    "/activity/:path*",
    "/calender/:path*",
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