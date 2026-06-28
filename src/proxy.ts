import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/library",
  "/reader",
  "/orders",
  "/settings",
  "/checkout",
  "/admin",
];

// Routes that should redirect authenticated users away
const AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

function isProtected(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check for access token in cookies (set server-side) or rely on client-side
  // Since we use localStorage for tokens, middleware only does a lightweight check
  // via cookie that is optionally set on login for SSR support
  const token = request.cookies.get("ebooks_auth")?.value;
  const isLoggedIn = Boolean(token);

  // Redirect unauthenticated users away from protected routes
  if (isProtected(pathname) && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth routes
  if (isAuthRoute(pathname) && isLoggedIn) {
    return NextResponse.redirect(new URL("/library", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
