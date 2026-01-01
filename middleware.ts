import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE_NAME = "session_token";

// Routes that don't require authentication
const publicPaths = [
  "/",
  "/login",
  "/register",
  "/viewer",
];

// API routes that don't require authentication
const publicApiPaths = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
];

function isPublicPath(pathname: string): boolean {
  // Check exact public paths
  if (publicPaths.includes(pathname)) {
    return true;
  }

  // Check public API paths
  if (publicApiPaths.some((path) => pathname.startsWith(path))) {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    // API routes return 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "UNAUTHENTICATED" },
        { status: 401 }
      );
    }

    // UI routes redirect to login with returnUrl
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Cookie exists - let the request through
  // Actual session validation happens in server helpers
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     * - cesium assets
     */
    "/((?!_next/static|_next/image|favicon.ico|cesium|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
