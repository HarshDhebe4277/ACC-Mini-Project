import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and auth routes are always allowed
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/manifest.json") ||
    pathname.startsWith("/sw.js") ||
    pathname.startsWith("/workbox") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/auth") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  // Check for presence of auth token or role in cookies
  const roleCookie = request.cookies.get("campus_role")?.value?.toUpperCase();
  const tokenCookie = request.cookies.get("campus_token")?.value;

  // If visiting protected role routes
  const protectedPrefixes = ["/student", "/organizer", "/faculty", "/admin"];
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !roleCookie && !tokenCookie) {
    // If not authenticated, redirect to login with return path
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Role gate enforcement if cookie is set
  if (roleCookie) {
    if (pathname.startsWith("/admin") && roleCookie !== "ADMIN") {
      return NextResponse.redirect(new URL(`/${roleCookie.toLowerCase()}/dashboard`, request.url));
    }
    if (pathname.startsWith("/faculty") && !["FACULTY", "ADMIN"].includes(roleCookie)) {
      return NextResponse.redirect(new URL(`/${roleCookie.toLowerCase()}/dashboard`, request.url));
    }
    if (pathname.startsWith("/organizer") && !["ORGANIZER", "ADMIN"].includes(roleCookie)) {
      return NextResponse.redirect(new URL(`/${roleCookie.toLowerCase()}/dashboard`, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

