import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cors, setCorsHeaders } from "./lib/cors";

// Add paths that require authentication
const protectedPaths = [
  "/upload-resume",
  "/interview",
  "/interview-analysis",
  "/resume-result",
  "/generate-questions",
  "/profile",
];

// Add paths that should redirect to home if already authenticated
const authPaths = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS for API routes
  if (pathname.startsWith("/api/")) {
    // Handle preflight OPTIONS request
    const corsResponse = cors(request);
    if (corsResponse) {
      return corsResponse;
    }

    // For non-OPTIONS requests, create a response and add CORS headers
    const response = NextResponse.next();
    setCorsHeaders(response, {
      origin: ["https://www.true-chance.com", "https://true-chance.com"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      headers: ["Content-Type", "Authorization"],
      credentials: true,
    });

    return response;
  }

  // Check if the path requires authentication
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );
  const isAuthPath = authPaths.some((path) => pathname.startsWith(path));

  // For now, let client-side components handle authentication
  // This prevents the infinite redirect loop
  // The ProtectedRoute component will handle the actual auth check

  // Only redirect auth paths if they have obvious auth cookies
  if (isAuthPath) {
    const hasAuthCookie = request.cookies.get("session")?.value;
    if (hasAuthCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     *
     * Note: We removed 'api' from the exclusion list to handle CORS
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
