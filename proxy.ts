import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/infra/security/tokenService";
import { verifySuperAdminToken } from "@/infra/security/superAdminTokenService";
import { SA_COOKIE_NAME } from "@/infra/http/cookies/superAdminCookie";

const COOKIE_NAME = process.env.AUTH_COOKIE_NAME ?? "__session";

/**
 * Next.js Edge Middleware — runs before every matched request.
 *
 * Two separate auth contexts:
 *
 * 1. Store Admin  — /dashboard/* protected by `__session` cookie (store JWT)
 * 2. Super Admin  — /admin/*     protected by `__sa_session` cookie (super admin JWT)
 *
 * Neither token is accepted by the other context.
 */

const PROTECTED_PREFIXES = ["/dashboard"];
const LOGIN_PATH = "/login";
const DEFAULT_AFTER_LOGIN = "/dashboard";

const ADMIN_PROTECTED_PREFIXES = ["/admin"];
const ADMIN_PUBLIC_PATHS = ["/admin/login"];
const ADMIN_LOGIN_PATH = "/admin/login";
const ADMIN_DEFAULT_AFTER_LOGIN = "/admin/stores";

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAdminProtected(pathname: string): boolean {
  return (
    ADMIN_PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) &&
    !ADMIN_PUBLIC_PATHS.includes(pathname)
  );
}

export async function proxy(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // ── Super Admin routes ────────────────────────────────────────────────────
  if (pathname === ADMIN_LOGIN_PATH) {
    const saToken = req.cookies.get(SA_COOKIE_NAME)?.value;
    if (saToken) {
      try {
        await verifySuperAdminToken(saToken);
        const dest = req.nextUrl.clone();
        dest.pathname = ADMIN_DEFAULT_AFTER_LOGIN;
        return NextResponse.redirect(dest);
      } catch {
        // Token invalid — let them reach the admin login page
      }
    }
    return NextResponse.next();
  }

  if (isAdminProtected(pathname)) {
    const saToken = req.cookies.get(SA_COOKIE_NAME)?.value;
    if (!saToken) return redirectToAdminLogin(req);
    try {
      await verifySuperAdminToken(saToken);
      return NextResponse.next();
    } catch {
      const response = redirectToAdminLogin(req);
      response.cookies.delete(SA_COOKIE_NAME);
      return response;
    }
  }

  // ── Store Admin routes ────────────────────────────────────────────────────
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

function redirectToAdminLogin(req: NextRequest): NextResponse {
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = ADMIN_LOGIN_PATH;
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/admin/:path*"],
};
