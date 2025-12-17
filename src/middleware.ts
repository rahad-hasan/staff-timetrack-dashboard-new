import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("refreshToken");

  if (!token) {
    return NextResponse.redirect(
      new URL("/", request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/timesheets/:path*",
    "/activity/:path*",
    "/calendar/:path*",
    "/insights/:path*",
    "/members/:path*",
    "/project-management/:path*",
    "/leave-management/:path*",
    "/notification/:path*",
    "/report/:path*",
    "/settings/:path*",
    "/download/:path*",
  ],
};
