import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  try {
    const { pathname } = req.nextUrl;
    
    // Public routes that don't require authentication
    const publicRoutes = ["/auth/signin", "/auth/signup"];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
    
    // If user is not authenticated and trying to access protected route
    if (!req.auth && !isPublicRoute) {
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }
    
    // If user is authenticated and trying to access auth pages, redirect to home
    if (req.auth && isPublicRoute) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    
    return NextResponse.next();
  } catch (error) {
    // If middleware fails, allow the request to proceed (fail open for auth routes)
    console.error("Middleware error:", error);
    const { pathname } = req.nextUrl;
    const publicRoutes = ["/auth/signin", "/auth/signup"];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
    
    // If it's a public route, allow it
    if (isPublicRoute) {
      return NextResponse.next();
    }
    
    // Otherwise, redirect to signin
    const signInUrl = new URL("/auth/signin", req.url);
    return NextResponse.redirect(signInUrl);
  }
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo.png, *.png, *.ico (images)
     * - site.webmanifest (manifest file)
     * - auth (auth pages)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|logo.png|.*\\.png$|.*\\.ico$|site.webmanifest|auth).*)",
  ],
};

