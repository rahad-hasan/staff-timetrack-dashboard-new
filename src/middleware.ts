import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AWIN_CAPTURE_ENABLED,
  AWIN_CLICK_COOKIE,
  AWIN_CLICK_SN_COOKIE,
  MARKETING_CONSENT_COOKIE,
  clickMaxAgeSeconds,
  cookieDomainFor,
  isStrictlyNecessary,
  normalizeAwc,
  parseConsent,
} from "@/lib/awinClick";

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

/**
 * An Awin publisher link that lands straight on the app (`?awc=…`): keep the
 * click in the same first-party cookie the marketing site's capture sets
 * (API `POST /affiliates/awin/click`), so the account / checkout that follows
 * can be attributed. HttpOnly — no script ever reads it; the server actions
 * forward it to the API. Consent denied keeps only a strictly-necessary click.
 * Written on whatever response this request gets, a login redirect included.
 */
function captureAwinClick(request: NextRequest, response: NextResponse) {
  if (!AWIN_CAPTURE_ENABLED) return;
  const params = request.nextUrl.searchParams;
  const awc = normalizeAwc(params.get("awc"));
  if (!awc) return;

  const domain = cookieDomainFor(request.headers.get("host"));
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...(domain ? { domain } : {}),
  };
  const clear = (name: string) =>
    response.cookies.set(name, "", { ...options, maxAge: 0, expires: new Date(0) });

  const strictlyNecessary = isStrictlyNecessary(params.get("sn"));
  const consent = parseConsent(request.cookies.get(MARKETING_CONSENT_COOKIE)?.value);
  if (consent === false && !strictlyNecessary) {
    clear(AWIN_CLICK_COOKIE);
    return;
  }

  const maxAge = clickMaxAgeSeconds(awc);
  if (maxAge === null) return;

  // One click per browser, the newest (Awin's last-click model): storing one
  // kind clears the other, exactly as the API's capture does.
  const [keep, drop] = strictlyNecessary
    ? [AWIN_CLICK_SN_COOKIE, AWIN_CLICK_COOKIE]
    : [AWIN_CLICK_COOKIE, AWIN_CLICK_SN_COOKIE];
  response.cookies.set(keep, awc, { ...options, maxAge });
  clear(drop);
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  // `/auth/**` is matched ONLY so the Awin capture sees its landings; it
  // stays public exactly as before. Every other matched path is protected.
  const { pathname } = request.nextUrl;
  const isPublic = pathname === "/auth" || pathname.startsWith("/auth/");

  let response: NextResponse;
  if (!isPublic && (!token || !JWT_SHAPE.test(token))) {
    response = NextResponse.redirect(publicUrl(request, "/auth/login"));
    // Drop a value that can never work rather than carry it on every request.
    if (token) response.cookies.delete("accessToken");
  } else {
    response = NextResponse.next();
  }

  captureAwinClick(request, response);
  return response;
}

export const config = {
  // Every authenticated top-level segment: each `(main_layout)` child plus the
  // standalone /billing and /onboarding pages. A new segment that is not
  // listed here renders for signed-out visitors. Public by omission:
  // /session-expired, /api/**, Next internals and static files. /auth/** is
  // listed last for the Awin click capture only and is exempted from the
  // session check in `middleware` (OTP and the conversion landing pages stay
  // public).
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
    "/auth/:path*",
  ],
};