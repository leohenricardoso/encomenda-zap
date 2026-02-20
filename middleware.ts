import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/infra/security/tokenService";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "__session";

/**
 * Next.js Edge Middleware — runs before every matched request.
 *
 * Protected paths (PROTECTED_PREFIXES) require a valid JWT in the auth cookie.
 * If the token is missing or invalid the user is redirected to /login.
 *
 * This is server-side enforcement — it cannot be bypassed by the browser.
 * jose is fully Edge Runtime compatible (no Node.js crypto dependency).
 */

const PROTECTED_PREFIXES = ["/dashboard"];
const LOGIN_PATH = "/login";
const DEFAULT_AFTER_LOGIN = "/dashboard";

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  // ── Already authenticated → bounce away from /login ──────────────────────
  if (pathname === LOGIN_PATH) {
    if (token) {
      try {
        await verifyToken(token);
        const dest = req.nextUrl.clone();
        dest.pathname = DEFAULT_AFTER_LOGIN;
        return NextResponse.redirect(dest);
      } catch {
        // Token invalid — let them reach the login page
      }
    }
    return NextResponse.next();
  }

  // ── Protected routes ──────────────────────────────────────────────────────
  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  if (!token) {
    return redirectToLogin(req);
  }

  try {
    await verifyToken(token);
    return NextResponse.next();
  } catch {
    // Token expired or tampered — clear it and redirect
    const response = redirectToLogin(req);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

function redirectToLogin(req: NextRequest): NextResponse {
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = LOGIN_PATH;
  // Preserve the original destination so login can redirect back
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
