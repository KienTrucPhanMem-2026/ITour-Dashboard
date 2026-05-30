import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_COOKIE = "access_token";
const ROLE_COOKIE = "itour_role";
const LOGIN_PATH = "/auth/login";
const TOURGUIDE_PATH = "/tourguide";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get(AUTH_COOKIE));

  if (pathname.startsWith(LOGIN_PATH)) {
    if (hasToken) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const role = request.cookies.get(ROLE_COOKIE)?.value;
  const allowedRoles = ["ADMIN", "MANAGER", "TOURGUIDE", "CONSULTANT", "TOURPLANNER"];

  if (!role || !allowedRoles.includes(role)) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    const response = NextResponse.redirect(url);
    response.cookies.delete(AUTH_COOKIE);
    response.cookies.delete(ROLE_COOKIE);
    return response;
  }

  // 1. Enforce admin, manager & tourplanner restrictions on /admin/...
  if (pathname.startsWith("/admin")) {
    if (role !== "ADMIN" && role !== "MANAGER" && role !== "TOURPLANNER") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // 2. Enforce tourguide restrictions on /tourguide/...
  if (pathname.startsWith("/tourguide")) {
    if (role !== "TOURGUIDE") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  // 3. Enforce consultant restrictions on /consultant/...
  if (pathname.startsWith("/consultant")) {
    if (role !== "CONSULTANT") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|icon-dark-32x32.png|icon-light-32x32.png|apple-icon.png).*)"],
};
