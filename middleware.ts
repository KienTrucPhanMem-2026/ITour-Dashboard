import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Cookie do JS frontend set trên chính domain dashboard — middleware có thể đọc được.
// KHÔNG dùng access_token vì đó là cookie của backend domain (khác domain trên production).
const ROLE_COOKIE = "itour_role";
const LOGIN_PATH = "/auth/login";
const TOURGUIDE_PATH = "/tourguide";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = request.cookies.get(ROLE_COOKIE)?.value;
  const hasToken = Boolean(role);

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


  if (role === "TOURPLANNER") {
    const isAllowed = pathname.startsWith("/tourplanner") || pathname.startsWith("/settings");
    if (!isAllowed) {
      const url = request.nextUrl.clone();
      url.pathname = "/tourplanner/tours";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith(TOURGUIDE_PATH)) {
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
